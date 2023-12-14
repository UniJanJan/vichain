export class TransactionPool {
    constructor() {
        this.transactions = [];
        this.lastTransactionIds = new Map();
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

}