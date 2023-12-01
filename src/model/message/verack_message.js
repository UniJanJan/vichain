export class VerAckMessage {
    constructor() {
        // type of message without payload

        Object.freeze(this);
    }

    clone() {
        return new VerAckMessage();
    }
}
