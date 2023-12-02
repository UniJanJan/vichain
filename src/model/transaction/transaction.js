export class Transaction {
    constructor(sourceAddress, targetAddress, amount, signature) {
        this.sourceAddress = sourceAddress;
        this.targetAddress = targetAddress;
        this.amount = amount;
        this.signature = signature;
    }

    clone() {
        return Object.assign(new Object(), this);
    }
}