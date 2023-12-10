import { Block } from "../../model/blockchain/block.js";
import { BlockBody } from "../../model/blockchain/block_body.js";

export class BlockchainService {

    constructor(network, node) {
        this.network = network;
        this.node = node;

        this.blockchain = this.node.blockchain;
    }

    createBlock(previousBlock, transactions) {
        var currentTimestamp = this.network.timer.currentTimestamp;
        
        var blockBody = new BlockBody(previousBlock.blockBody.height + 1, previousBlock.blockHash, transactions, currentTimestamp);
        return new Block(blockBody, CryptoJS.SHA256(JSON.stringify(blockBody)));
    }

}