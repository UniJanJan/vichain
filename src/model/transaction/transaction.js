export class Transaction {

    constructor(transactionBody, signature, transactionHash) {
        this.transactionBody = transactionBody;
        this.signature = signature;
        this.transactionHash = transactionHash.toString();
        Object.freeze(this);
    }

    equals(transaction) {
        return this === transaction || JSON.stringify(this) === JSON.stringify(transaction);
    }

    clone() {
        return Object.assign(new Object(), this); // TODO
    }
}