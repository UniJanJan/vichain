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

    pick(transactionsNumber = 1) {
        return this.transactions.splice(0, transactionsNumber);
    }
}