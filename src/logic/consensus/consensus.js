export class Consensus {

    constructor(network) {
        this.network = network;
    }

    /* if potentialyNextBlock could be successor of currentlyLeadingBlock, function constructs new leading block of blockchain or returns null if new block is invalid */
    constructValidLeadingBlock(currentlyLeadingBlock, potentialyNextBlock) {
        throw new Error(`Consensus protocol not implemented!`);
    }


    canAddressConstructNewBlock(currentlyLeadingBlock, potentialyConstructingAddress, timestamp) {
        throw new Error(`Consensus protocol not implemented!`);
    }

    isTransactionValid(transaction, asAwardTransaction, timestamp, lastTransactionIds) {
        throw new Error(`Consensus protocol not implemented!`);
    }

}