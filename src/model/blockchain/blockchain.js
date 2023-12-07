import { DiscreteIntervalMap } from "../../common/interval_map.js";

export class Blockchain {
    constructor() {
        this.leadingBlocks = []; //TODO
    }

    appendBlock(block, burnAddress) { //TODO
        if (this.leadingBlocks.length === 0 && block.blockBody.height === 0) {
            var insertableGenesisBlock = new BlockWrapper(block, null, burnAddress);
            this.leadingBlocks.push(insertableGenesisBlock);
        } else if (this.leadingBlocks.length > 0 && block.blockBody.height > 0) {
            var jointBlock = this.getBlockByHashAndHeight(block.blockBody.previousBlockHash, block.blockBody.height - 1);
            if (jointBlock !== null) {
                var insertableBlock = new BlockWrapper(block, jointBlock.block, burnAddress);
                if (jointBlock.isLeadingBlock) {
                    this.leadingBlocks.splice(this.leadingBlocks.indexOf(jointBlock.leadingBlock), 1, insertableBlock);
                } else {
                    this.leadingBlocks.push(insertableBlock);
                }
            } else {
                // throw new Error("Invalid block append attempt!", block);
            }
        }
    }

    getBlockByHashAndHeight(blockHash, height) {
        for (var leadingBlock of this.leadingBlocks) {
            var currentBlock = leadingBlock;
            while (currentBlock.block.blockBody.height > height && currentBlock.previousBlock !== null) {
                currentBlock = currentBlock.previousBlock;
            }
            if (currentBlock.block.blockHash == blockHash && currentBlock.block.blockBody.height === height) {
                return {
                    block: currentBlock,
                    isLeadingBlock: currentBlock === leadingBlock,
                    leadingBlock: leadingBlock
                };
            }
        }
        return null;
    }
}

class BlockWrapper {
    constructor(block, previousBlock, burnAddress) {
        this.block = block;
        this.previousBlock = previousBlock;
        this.burnMap = previousBlock ? new DiscreteIntervalMap(previousBlock.burnMap) : new DiscreteIntervalMap();
        this.accountMap = previousBlock ? new Map(previousBlock.accountMap) : new Map();

        this.block.blockBody.transactions.forEach(transaction => {
            var { sourceAddress, targetAddress, amount } = transaction.transactionBody;

            if (targetAddress.equals(burnAddress)) {
                this.burnMap.push(amount, sourceAddress);
            }


            if (sourceAddress) {
                var inputBalance = this.accountMap.get(transaction.transactionBody.sourceAddress) || 0;
                this.accountMap.set(sourceAddress, inputBalance - amount);
            }

            var outputBalance = this.accountMap.get(targetAddress) || 0;
            this.accountMap.set(targetAddress, outputBalance + amount);
        });
    }
}