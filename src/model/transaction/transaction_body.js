export class TransactionBody {

    constructor(sourceAddress, targetAddress, amount) {
        this.id = null; //TODO
        this.sourceAddress = sourceAddress;
        this.targetAddress = targetAddress;
        this.amount = amount;
        Object.freeze(this);
    }

    clone() {
        return Object.assign(new Object(), this);
    }

}