import { DiscreteIntervalMap } from "../../common/interval_map.js";

export class Blockchain {

    constructor() {
        this.leadingBlocks = []; // Invariant: all leading blocks have the same height
    }

    getFirstBlockchain() {
        var blockchain = [];

        var currentBlock = this.leadingBlocks[0];
        while (currentBlock !== null) {
            blockchain.unshift(currentBlock.block);
            currentBlock = currentBlock.previousBlock;
        }

        return blockchain;
    }

}

export class BlockchainElement {
    constructor(block, previousBlock) {
        this.block = block;
        this.previousBlock = previousBlock;
    }
}