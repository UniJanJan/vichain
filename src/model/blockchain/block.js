export class Block {
    constructor(blockBody, blockHash) {
        this.blockBody = blockBody;
        this.blockHash = blockHash.toString();

        Object.freeze(this);
    }

    equals(block) {
        return this === block || JSON.stringify(this) == JSON.stringify(block);
    }

    isPreviousFor(block) {
        return this.blockHash == block.blockBody.previousBlockHash;
    }
}