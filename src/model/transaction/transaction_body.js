export class TransactionBody {

    constructor(id, sourceAddress, targetAddress, amount, creationTimestamp, validityDuration) {
        this.id = id;
        this.sourceAddress = sourceAddress;
        this.targetAddress = targetAddress;
        this.amount = amount;
        this.creationTimestamp = creationTimestamp;
        this.validityDuration = validityDuration;
        this.validTo = creationTimestamp + validityDuration;
        Object.freeze(this);
    }

    clone() {
        return Object.assign(new Object(), this);
    }

}