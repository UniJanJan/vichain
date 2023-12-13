import { RSA } from "../../common/rsa.js";
import { Transaction } from "../../model/transaction/transaction.js";
import { TransactionBody } from "../../model/transaction/transaction_body.js";

export class TransactionService {

    constructor(network, node) {
        this.network = network;
        this.node = node;

        this.transactionPool = this.node.transactionPool;
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
        var transactionHash = CryptoJS.SHA256(transactionBody);
        return new Transaction(transactionBody, signature, transactionHash);
    }

    postTransaction(sourceAddress, targetAddress, amount) {

    }

    dropTransactions(transactions) {
        transactions.forEach(transaction => {
            if (this.transactionPool.contains(transaction)) {
                this.transactionPool.remove(transaction);
            }
        });
    }

    dropStaleTransactions() {
        var currentTimestamp = this.network.timer.currentTimestamp;
        this.transactionPool.transactions = this.transactionPool.transactions.filter(transaction => transaction.transactionBody.validTo > currentTimestamp);
    }

    pickUncommittedTransactions(transactionsNumber = 1) {
        // var uncommittedTransactions = this.transactionPool.transactions.splice(0, transactionsNumber);
        // uncommittedTransactions.forEach(transaction => {
        //     var { id, sourceAddress } = transaction.transactionBody;
        //     var lastTransactionId = this.transactionPool.lastTransactionId.get(sourceAddress.toString(16)) || 0;
        //     if (lastTransactionId < id) {
        //         this.transactionPool.lastTransactionId.set(sourceAddress.toString(16), id);
        //     }

        // });
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

            var lastTransactionId = this.transactionPool.lastTransactionId.get(sourceAddress.toString(16)) || 0;
            if (id > lastTransactionId) { // what if two the same ids?
                // newLastTransactionIds.push({ sourceAddress, id });
                this.transactionPool.transactions.push(transaction);
                putTransactions.push(transaction);
            }
        })

        // newLastTransactionIds.forEach(entry => this.transactionPool.lastTransactionId.set(entry.sourceAddress.toString(16), entry.id));

        transactions.forEach(transaction => {
            var { id, sourceAddress } = transaction.transactionBody;

            var lastTransactionId = this.transactionPool.lastTransactionId.get(sourceAddress.toString(16)) || 0;
            if (id > lastTransactionId) {
                this.transactionPool.lastTransactionId.set(sourceAddress.toString(16), id);
            }
        })

        return putTransactions;
    }

}