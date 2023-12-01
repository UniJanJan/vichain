/* message for link closing */
export class RejectMessage {
    constructor() {
        // type of message without payload

        Object.freeze(this);
    }

    clone() {
        return new RejectMessage();
    }
}
