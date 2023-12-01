export class GetAddrMessage {
    constructor() {
        // type of message without payload

        Object.freeze(this);
    }

    clone() {
        return new GetAddrMessage();
    }
}
