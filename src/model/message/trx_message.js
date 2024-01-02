export class TrxMessage {

    constructor(transaction, informedNodes) {
        this.transaction = transaction;
        this.informedNodes = informedNodes || [];

        Object.freeze(this);
    }

    clone() {
        return new TrxMessage(this.transaction.clone(), [...this.informedNodes]);
    }
}
