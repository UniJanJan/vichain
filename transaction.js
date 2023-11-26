export class Transaction {
    constructor(sourceAddress, targetAddress, amount) {
        this.sourceAddress = sourceAddress;
        this.targetAddress = targetAddress;
        this.amount = amount;
    }

    clone() {
        return new Transaction(this.sourceAddress, this.targetAddress, this.amount);
    }
}