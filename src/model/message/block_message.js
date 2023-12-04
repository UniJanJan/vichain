export class BlockMessage {
    constructor(block) {
        this.block = block;

        Object.freeze(this);
    }

    clone() {
        return Object.assign(new Object(), this);
    }
}
