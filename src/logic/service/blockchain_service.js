import { Block } from "../../model/blockchain/block.js";
import { BlockBody } from "../../model/blockchain/block_body.js";
import { BlockWrapper } from "../../model/blockchain/blockchain.js";

export class BlockchainService {

    constructor(network, node) {
        this.network = network;
        this.node = node;

        this.blockchain = this.node.blockchain;
    }

    getBlockchainHeight() {
        return this.blockchain.leadingBlocks.length > 0 ? this.blockchain.leadingBlocks[0].block.blockBody.height : -1;
    }

    createBlock(previousBlock, transactions) {
        var currentTimestamp = this.network.timer.currentTimestamp;

        var blockBody = new BlockBody(previousBlock.blockBody.height + 1, previousBlock.blockHash, transactions, currentTimestamp);
        return new Block(blockBody, CryptoJS.SHA256(JSON.stringify(blockBody)));
    }

    getBlockByHashAndHeight(blockHash, height) {
        for (var leadingBlock of this.blockchain.leadingBlocks) {
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

    appendBlock(block) {
        var burnAddress = this.network.walletPool.getBurnAddress();

        if (this.blockchain.leadingBlocks.length === 0 && block.blockBody.height === 0) {
            var insertableGenesisBlock = new BlockWrapper(block, null, burnAddress);
            this.blockchain.leadingBlocks.push(insertableGenesisBlock);
            return insertableGenesisBlock;
        } else if (this.blockchain.leadingBlocks.length > 0 && block.blockBody.height >= this.blockchain.leadingBlocks[0].block.blockBody.height) {
            var jointBlock = this.getBlockByHashAndHeight(block.blockBody.previousBlockHash, block.blockBody.height - 1);
            if (jointBlock !== null) {
                var insertableBlock = new BlockWrapper(block, jointBlock.block, burnAddress);
                if (jointBlock.isLeadingBlock) {
                    // LONGEST-CHAIN RULE (NO HEIGHT DIFFERENCE ALLOWED)
                    this.blockchain.leadingBlocks = this.blockchain.leadingBlocks.flatMap(leadingBlock => {
                        if (leadingBlock === jointBlock.leadingBlock) {
                            return [insertableBlock];
                        } else if (leadingBlock.block.blockBody.height >= insertableBlock.block.blockBody.height) {
                            return [leadingBlock];
                        } else {
                            return [];
                        }
                    });
                } else {
                    this.blockchain.leadingBlocks.push(insertableBlock);
                }

                block.blockBody.transactions.forEach(transaction => {
                    var { id, sourceAddress } = transaction.transactionBody;

                    if (sourceAddress) {
                        var lastTransactionId = this.node.transactionPool.lastTransactionId.get(sourceAddress.toString(16)) || 0;
                        if (lastTransactionId < id) {
                            this.node.transactionPool.lastTransactionId.set(sourceAddress.toString(16), id);
                        }
                    }
                })

                // this.node.managedAccounts.accounts.forEach((account, address) => {
                //     var lastTransactionId = this.node.transactionPool.lastTransactionId.get(address);
                //     account.frozenAmounts.forEach((frozenAmount, transactionHash) => {
                //         if (frozenAmount.transactionId < lastTransactionId) {
                //             account.availableBalance += frozenAmount.amount;
                //             account.frozenAmounts.delete(transactionHash);
                //             console.log(`Transaction ${transactionHash} dropped for ${address}`)
                //         }
                //     });
                // });

                return insertableBlock;
            } else {
                return null;
            }
        }
    }

    getMiners(leadingBlock) {
        var minersPerRound = this.network.settings.minersPerRound;
        var lastBlocks = [];
        var currentBlock = leadingBlock;
        while (lastBlocks.length < 2 * minersPerRound && currentBlock !== null) {
            lastBlocks.unshift(currentBlock.block);
            currentBlock = currentBlock.previousBlock;
        }

        var seedInputBlocks = lastBlocks.slice(0, minersPerRound);

        var seed = seedInputBlocks.map(block => parseInt(block.blockHash.toString()[1], 16) % 2).join('')
            + seedInputBlocks[seedInputBlocks.length - 1].blockBody.height;

        return [...Array(minersPerRound).keys()]
            .map((_, index) => CryptoJS.SHA256(seed + index).toString())
            .map(hash => bigInt(hash, 16))
            .map(number => number.mod(leadingBlock.burnMap.summedInvervalsSize))
            .map(leadingBlock.burnMap.get.bind(leadingBlock.burnMap))
            .map(Vue.toRaw);
    }

    isBlockValid(block) {
        var blockchainHeight = this.getBlockchainHeight();
        if (block.blockBody.height !== blockchainHeight + 1
            && block.blockBody.height !== blockchainHeight) {
            return false;
        }

        if (this.getBlockByHashAndHeight(block.blockHash, block.blockBody.height) !== null) {
            return false;
        }

        if (block === this.network.settings.genesisBlock) {
            return true;
        }

        var blockCreationTimestamp = block.blockBody.creationTimestamp;
        if (blockCreationTimestamp > this.network.timer.currentTimestamp) {
            return false;
        }

        var potentialyPreviousBlock = this.getBlockByHashAndHeight(block.blockBody.previousBlockHash, block.blockBody.height - 1);
        if (potentialyPreviousBlock === null) {
            return false;
        }


        //drop blocks from the future
        var roundStartTimestamp = blockCreationTimestamp - (blockCreationTimestamp % this.network.settings.roundTime);
        var currentBlock = potentialyPreviousBlock.block;
        var blocksInRound = [block];
        while (currentBlock.block.blockBody.creationTimestamp > roundStartTimestamp) {
            blocksInRound.unshift(currentBlock.block);
            currentBlock = currentBlock.previousBlock;
        }

        var miners = this.getMiners(currentBlock);

        var i = 0;
        var j = 0;
        while (i < blocksInRound.length && j < miners.length) {
            if (miners[j] === blocksInRound[i].blockBody.transactions[blocksInRound[i].blockBody.transactions.length - 1].transactionBody.targetAddress.toString(16)) {
                i++;
            } else {
                j++;
            }
        }

        return i === blocksInRound.length;
    }

}