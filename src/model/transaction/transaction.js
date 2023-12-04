export class Transaction {
    constructor(transactionBody, signature) {
        this.transactionBody = transactionBody;
        this.signature = signature;
        Object.freeze(this);
    }

    clone() {
        return Object.assign(new Object(), this); // TODO
    }
}