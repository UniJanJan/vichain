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
}