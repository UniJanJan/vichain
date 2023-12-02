export class Block {
    constructor(blockHash, previousBlockHash, transactions) {
        this.blockHash = blockHash;
        this.previousBlockHash = previousBlockHash;
        this.transactions = transactions;
    }
}