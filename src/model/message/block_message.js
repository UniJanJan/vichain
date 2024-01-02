export class BlockMessage {

    constructor(block, informedNodes) {
        this.block = block;
        this.informedNodes = informedNodes || [];

        this.prioritized = true;

        Object.freeze(this);
    }

    clone() {
        return Object.assign(new Object(), [...this.informedNodes], this);
    }
}
