export class GetTransactionsMessage {
    constructor() {
        // type of message without payload

        Object.freeze(this);
    }

    clone() {
        return new GetTransactionsMessage();
    }
}