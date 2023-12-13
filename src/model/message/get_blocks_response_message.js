export class GetBlocksResponseMessage {
    constructor(blocks) {
        this.blocks = blocks;

        Object.freeze(this);
    }

    clone() {
        return new GetBlocksResponseMessage();
    }
}