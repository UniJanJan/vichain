export class TrxMessage {
    constructor(transaction) {
        this.transaction = transaction;

        Object.freeze(this);
    }

    clone() {
        return new TrxMessage(this.transaction.clone());
    }
}
