export class TransactionPool {
    constructor() {
        this.transactions = [];
    }

    contains(transaction) {
        return this.transactions.includes(transaction);
    }

    put(transaction) {
        this.transactions.push(transaction);
    }

    remove(transaction) {
        this.transactions.splice(this.transactions.indexOf(transaction), 1);
    }

    pick(transactionsNumber = 1) {
        return this.transactions.splice(0, transactionsNumber);
    }

    dropStaleTransactions(timestamp) {
        this.transactions = this.transactions.filter(transaction => transaction.transactionBody.validTo > timestamp)
    }

}