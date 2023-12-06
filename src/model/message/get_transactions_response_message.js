export class GetTransactionsResponseMessage {
    constructor(transactions) {
        this.transactions = transactions;

        Object.freeze(this);
    }

    clone() {
        return new GetTransactionsResponseMessage();
    }
}