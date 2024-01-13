import { RSA } from "../../common/rsa.js";
import { Transaction } from "../../model/transaction/transaction.js";
import { TransactionBody } from "../../model/transaction/transaction_body.js";
import { ProofOfBurnConsensus } from "../consensus/proof_of_burn_consensus.js";

export class TransactionService {

    constructor(network, node) {
        this.network = network;
        this.node = node;

        this.transactionPool = this.node.transactionPool;

        this.consensuses = new Map([
            [ProofOfBurnConsensus.name, new ProofOfBurnConsensus(network)]
        ]);
    }

    createTransaction(sourceWallet, targetAddress, amount, transactionId) {
        var currentTimestamp = this.network.timer.currentTimestamp;
        var transactionValidityDuration = this.network.settings.transactionValidityDuration;
        transactionId = transactionId || this.getNextTransactionId(sourceWallet.publicKey);

        var transactionBody = new TransactionBody(transactionId, sourceWallet.publicKey, targetAddress, amount, currentTimestamp, transactionValidityDuration);
        return this.createSignedTransaction(transactionBody, sourceWallet);
    }

    createBurnTransaction(sourceWallet, amount, transactionId) {
        var burnAddress = this.network.walletPool.getBurnAddress();
        return this.createTransaction(sourceWallet, burnAddress, amount, transactionId);
    }

    createAwardTransaction(targetWallet, awardAmount, transactionId) {
        var currentTimestamp = this.network.timer.currentTimestamp;
        awardAmount = awardAmount || this.network.settings.miningAward;
        transactionId = transactionId || this.getNextTransactionId(targetWallet.publicKey);

        var transactionBody = new TransactionBody(transactionId, null, targetWallet.publicKey, awardAmount, currentTimestamp, 0);
        return this.createSignedTransaction(transactionBody, targetWallet);
    }

    createSignedTransaction(transactionBody, signingWallet) {
        var transactionHash = CryptoJS.SHA256(JSON.stringify(transactionBody));
        var signature = RSA.createSignature(transactionHash, signingWallet.privateKey, signingWallet.publicKey);
        return new Transaction(transactionBody, signature, transactionHash);
    }

    getNextTransactionId(address) {
        return this.getLastUncommittedTransactionId(address) + 1;
    }

    postTransaction(sourceAddress, targetAddress, amount) {

    }

    isTransactionValid(transaction, asAwardTransaction) {
        var consensusProtocol = this.consensuses.get(ProofOfBurnConsensus.name);
        return consensusProtocol.isTransactionValid(transaction, asAwardTransaction, this.network.timer.currentTimestamp, this.transactionPool.lastCommittedTransactionIds);
    }

    dropTransactions(transactions) {
        transactions.forEach(transaction => {
            if (this.transactionPool.contains(transaction)) {
                this.transactionPool.remove(transaction);
            }
        });
    }

    getLastUncommittedTransactionId(address) {
        return this.transactionPool.lastUncommittedTransactionIds.get(address) || 0;
    }

    getLastCommittedTransactionsId(address) {
        return this.transactionPool.lastCommittedTransactionIds.get(address) || 0;
    }

    updateLastUncommittedTransactionsId(address, uncommittedTransactionId) {
        var currentLastUncommittedTransactionId = this.getLastUncommittedTransactionId(address);
        if (uncommittedTransactionId > currentLastUncommittedTransactionId) {
            this.transactionPool.lastUncommittedTransactionIds.set(address, uncommittedTransactionId);
        }
    }

    updateLastCommittedTransactionsId(address, committedTransactionId) {
        var currentLastCommittedTransactionId = this.getLastCommittedTransactionsId(address);
        if (committedTransactionId > currentLastCommittedTransactionId) {
            this.transactionPool.lastCommittedTransactionIds.set(address, committedTransactionId);
        }

        this.updateLastUncommittedTransactionsId(address, committedTransactionId);
    }

    updateTransactionPool(leadingBlock) {
        leadingBlock.lastTransactionIds.forEach((lastCommittedTransactionId, address) => {
            this.updateLastCommittedTransactionsId(address, lastCommittedTransactionId);
        })

        this.dropStaleTransactions();
    }

    /* drop transactions with lower ID than last committed transaction ID or with expired time */
    dropStaleTransactions() {
        var currentTimestamp = this.network.timer.currentTimestamp;

        this.transactionPool.transactions = this.transactionPool.transactions.filter((transaction, index) => {
            var { id, sourceAddress, validTo } = transaction.transactionBody;

            var lastTransactionId = this.transactionPool.lastCommittedTransactionIds.get(sourceAddress) || 0;
            return id > lastTransactionId && validTo >= currentTimestamp;
        });
    }

    pickUncommittedTransactions(balanceMap, transactionsNumber = 1) {
        var operationalBalanceMap = new Map(balanceMap);
        var pickedTransactions = [];
        var transactionsToReturnIntoTransactionPool = []

        while (pickedTransactions.length < transactionsNumber && this.transactionPool.transactions.length > 0) {
            var transaction = this.transactionPool.transactions.pop();
            var { sourceAddress, targetAddress, amount } = transaction.transactionBody;
            var sourceAddressBalance = operationalBalanceMap.get(sourceAddress) || 0;
            if (amount <= sourceAddressBalance) {
                operationalBalanceMap.set(sourceAddress, sourceAddressBalance - amount);
                var targetAddressBalance = operationalBalanceMap.get(targetAddress) || 0;
                operationalBalanceMap.set(targetAddress, targetAddressBalance + amount);
                pickedTransactions.push(transaction);
            } else {
                transactionsToReturnIntoTransactionPool.push(transaction);
            }
        }

        transactionsToReturnIntoTransactionPool
            .forEach(transaction => this.transactionPool.transactions.push(transaction));

        return pickedTransactions;
    }

    putUncommittedTransaction(transaction) {
        return this.putUncommittedTransactions([transaction]).length === 1;
    }

    putUncommittedTransactions(transactions) {
        if (transactions.length === 0) {
            return []
        }

        var currentTimestamp = this.network.timer.currentTimestamp;
        var putTransactions = []


        var transactionsByAddress = new Map();
        transactions.forEach(transaction => {
            var sourceAddress = transaction.transactionBody.sourceAddress;
            var transactionsOfAddress = transactionsByAddress.get(sourceAddress);
            if (transactionsOfAddress) {
                transactionsOfAddress.push(transaction);
            } else {
                transactionsByAddress.set(sourceAddress, [transaction]);
            }
        })

        transactionsByAddress.forEach((transactions, sourceAddress) => {
            var putTransactionsIds = new Set();

            transactions.forEach(transaction => {
                var { id, validTo } = transaction.transactionBody;

                var lastTransactionId = this.transactionPool.lastUncommittedTransactionIds.get(sourceAddress) || 0;
                if (id > lastTransactionId) {
                    this.transactionPool.lastUncommittedTransactionIds.set(sourceAddress, id);
                    if (!putTransactionsIds.has(id) && validTo > currentTimestamp) {
                        this.transactionPool.transactions.push(transaction);
                        putTransactions.push(transaction);
                        putTransactionsIds.add(id);
                    }
                }
            })
        });

        return putTransactions;
    }

}