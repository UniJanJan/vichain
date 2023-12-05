export class BlockBody {
    constructor(height, previousBlockHash, transactions) {
        this.height = height;
        this.previousBlockHash = previousBlockHash;
        this.transactions = transactions;

        Object.freeze(this);
    }
}