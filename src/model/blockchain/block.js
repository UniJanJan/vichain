export class Block {
    constructor(blockBody, blockHash) {
        this.blockBody = blockBody;
        this.blockHash = blockHash;

        Object.freeze(this);
    }
}