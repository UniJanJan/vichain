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

    createTransaction(sourceAccount, targetAddress, amount) {
        var currentTimestamp = this.network.timer.currentTimestamp;
        var transactionValidityDuration = this.network.settings.transactionValidityDuration;

        var transactionBody = new TransactionBody(sourceAccount.nextTransactionId++, sourceAccount.wallet.publicKey, targetAddress, amount, currentTimestamp, transactionValidityDuration);
        return this.createSignedTransaction(transactionBody, sourceAccount.wallet);
    }

    createBurnTransaction(sourceAccount, amount) {
        var burnAddress = this.network.walletPool.getBurnAddress();
        return this.createTransaction(sourceAccount, burnAddress, amount);
    }

    createAwardTransaction(targetAccount, awardAmount) {
        var currentTimestamp = this.network.timer.currentTimestamp;
        awardAmount = awardAmount || this.network.settings.miningAward;

        var transactionBody = new TransactionBody(targetAccount.nextTransactionId++, null, targetAccount.wallet.publicKey, awardAmount, currentTimestamp, 0);
        return this.createSignedTransaction(transactionBody, targetAccount.wallet);
    }

    createSignedTransaction(transactionBody, signingWallet) {
        var signature = RSA.createSignature(transactionBody, signingWallet.privateKey, signingWallet.publicKey);
        var transactionHash = CryptoJS.SHA256(JSON.stringify(transactionBody));
        return new Transaction(transactionBody, signature, transactionHash);
    }

    postTransaction(sourceAddress, targetAddress, amount) {

    }

    isTransactionValid(transaction, asAwardTransaction) {
        var consensusProtocol = this.consensuses.get(ProofOfBurnConsensus.name);
        return consensusProtocol.isTransactionValid(transaction, asAwardTransaction, this.network.timer.currentTimestamp, this.transactionPool.lastTransactionIds);
    }

    dropTransactions(transactions) {
        transactions.forEach(transaction => {
            if (this.transactionPool.contains(transaction)) {
                this.transactionPool.remove(transaction);
            }
        });
    }

    updateTransactionPool(leadingBlock) {
        this.transactionPool.lastTransactionIds.forEach((lastId, address) => {
            var blockchainLastId = leadingBlock.lastTransactionIds.get(address) || 0;
            if (blockchainLastId > lastId) {
                this.transactionPool.lastTransactionIds.set(address, blockchainLastId);
            }
        });

        this.transactionPool.transactions.forEach((transaction, index) => {
            var lastId = leadingBlock.lastTransactionIds.get(transaction.transactionBody.sourceAddress.toString(16)) || 0;
            if (transaction.transactionBody.id <= lastId) {
                this.transactionPool.transactions.splice(index, 1);
            }
        })
    }

    dropStaleTransactions() {
        var currentTimestamp = this.network.timer.currentTimestamp;
        this.transactionPool.transactions = this.transactionPool.transactions.filter(transaction => transaction.transactionBody.validTo > currentTimestamp);
    }

    pickUncommittedTransactions(transactionsNumber = 1) {
        return this.transactionPool.transactions.splice(0, transactionsNumber);
    }

    putUncommittedTransaction(transaction) {
        return this.putUncommittedTransactions([transaction]).length === 1;
    }

    putUncommittedTransactions(transactions) {
        // var newLastTransactionIds = [];

        var putTransactions = []

        transactions.forEach(transaction => {
            var { id, sourceAddress } = transaction.transactionBody;

            var lastTransactionId = this.transactionPool.lastTransactionIds.get(sourceAddress.toString(16)) || 0;
            if (id > lastTransactionId) { // what if two the same ids?
                // newLastTransactionIds.push({ sourceAddress, id });
                this.transactionPool.transactions.push(transaction);
                putTransactions.push(transaction);
            }
        })

        // newLastTransactionIds.forEach(entry => this.transactionPool.lastTransactionId.set(entry.sourceAddress.toString(16), entry.id));

        transactions.forEach(transaction => {
            var { id, sourceAddress } = transaction.transactionBody;

            var lastTransactionId = this.transactionPool.lastTransactionIds.get(sourceAddress.toString(16)) || 0;
            if (id > lastTransactionId) {
                this.transactionPool.lastTransactionIds.set(sourceAddress.toString(16), id);
            }
        })

        return putTransactions;
    }

}