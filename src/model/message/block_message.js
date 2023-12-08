export class BlockMessage {
    constructor(block) {
        this.block = block;

        this.prioritized = true;

        Object.freeze(this);
    }

    clone() {
        return Object.assign(new Object(), this);
    }
}
