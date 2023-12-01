export class AddrMessage {
    constructor(linkedNodes) {
        this.linkedNodes = linkedNodes;

        Object.freeze(this);
    }

    clone() {
        return new AddrMessage(this.linkedNodes.slice());
    }
}
