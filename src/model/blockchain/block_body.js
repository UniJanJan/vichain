export class BlockBody {
    constructor(height, previousBlockHash, transactions, creationTimestamp) {
        this.height = height;
        this.previousBlockHash = previousBlockHash;
        this.transactions = transactions;
        this.creationTimestamp = creationTimestamp;

        Object.freeze(this);
    }

    equals(blockBody) {
        return this === blockBody || JSON.stringify(this) == JSON.stringify(blockBody);
    }

}