import { Block } from "../../model/blockchain/block.js";
import { BlockBody } from "../../model/blockchain/block_body.js";
import { ProofOfBurnConsensus } from "../consensus/proof_of_burn_consensus.js";

export class BlockchainService {

    constructor(network, node) {
        this.network = network;
        this.node = node;

        this.blockchain = this.node.blockchain;

        this.consensuses = new Map([
            [ProofOfBurnConsensus.name, new ProofOfBurnConsensus(network)]
        ]);
    }

    getBlockchainHeight() {
        return this.blockchain.leadingBlocks.length > 0 ? this.blockchain.leadingBlocks[0].block.blockBody.height : -1;
    }

    findHighestJointBlock(blocks) {
        var currentHeight = this.getBlockchainHeight();

        var jointLeadingBlocks = this.blockchain.leadingBlocks.filter(leadingBlock => leadingBlock.block.blockHash === blocks[currentHeight].blockHash);

        if (jointLeadingBlocks.length > 1) {
            throw new Error("ERROR: findHighestJointBlock");
        } else if (jointLeadingBlocks.length === 1) {
            return {
                jointBlock: jointLeadingBlocks[0],
                blocksToVerify: blocks.slice(currentHeight + 1)
            };
        } else {
            currentHeight--;
            var currentBlock = this.blockchain.leadingBlocks[0].previousBlock;
            while (currentBlock !== null && currentBlock.block.blockHash !== blocks[currentHeight].blockHash) {
                currentBlock = currentBlock.previousBlock;
                currentHeight--;
            }

            return {
                jointBlock: currentBlock,
                blocksToVerify: blocks.slice(currentHeight + 1)
            };
        }
    }

    createBlock(previousBlock, transactions) {
        var currentTimestamp = this.network.timer.currentTimestamp;

        var blockBody = new BlockBody(previousBlock.blockBody.height + 1, previousBlock.blockHash, transactions, currentTimestamp);
        return new Block(blockBody, CryptoJS.SHA256(JSON.stringify(blockBody)));
    }

    appendBlock(validLeadingBlock) {
        var block = validLeadingBlock.block;
        var blockHeight = block.blockBody.height;
        var blockchainHeight = this.getBlockchainHeight();

        if (blockHeight >= blockchainHeight) {
            if (!this.isOneOfTheLeadingBlocks(block)) {
                // LONGEST-CHAIN RULE (NO HEIGHT DIFFERENCE ALLOWED)
                var blockchainHeight = this.getBlockchainHeight();
                if (blockHeight > blockchainHeight) {
                    this.blockchain.leadingBlocks = [validLeadingBlock];
                } else {
                    this.blockchain.leadingBlocks.push(validLeadingBlock);
                }

                return true;
            } else {
                return false;
            }
        }
    }

    isOneOfTheLeadingBlocks(block) {
        return this.blockchain.leadingBlocks.some(leadingBlock => leadingBlock.block.equals(block));
    }

    constructValidLeadingBlock(currentlyLeadingBlock, potentialyNextBlock) {
        var consensusProtocol = this.consensuses.get(ProofOfBurnConsensus.name);
        return consensusProtocol.constructValidLeadingBlock(currentlyLeadingBlock, potentialyNextBlock);
    }

    canAddressConstructNewBlock(currentlyLeadingBlock, potentialyConstructingAddress, timestamp) {
        var consensusProtocol = this.consensuses.get(ProofOfBurnConsensus.name);
        return consensusProtocol.canAddressConstructNewBlock(currentlyLeadingBlock, potentialyConstructingAddress, timestamp);
    }

}