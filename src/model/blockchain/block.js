export class Block {
    constructor(blockBody, blockHash, previousBlock) {
        this.blockBody = blockBody;
        this.blockHash = blockHash;
        this.previousBlock = previousBlock;
    }
}