export class Transaction {
    
    constructor(transactionBody, signature, transactionHash) {
        this.transactionBody = transactionBody;
        this.signature = signature;
        this.transactionHash = transactionHash;
        Object.freeze(this);
    }

    clone() {
        return Object.assign(new Object(), this); // TODO
    }
}