export class GetBlocksResponseMessage {
    constructor(leadingBlocks) {
        this.leadingBlocks = leadingBlocks; // probably TODO

        Object.freeze(this);
    }

    clone() {
        return new GetBlocksResponseMessage();
    }
}