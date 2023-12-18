export class TransactionPool {
    constructor() {
        this.transactions = [];
        this.lastUncommittedTransactionIds = new Map(); /* no new transaction with higher ID should be added to transaction pool */
        this.lastCommittedTransactionIds = new Map(); /* all transactions with lower or equal ID should be removed from transaction pool */
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