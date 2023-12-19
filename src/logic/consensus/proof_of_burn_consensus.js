import { DiscreteIntervalMap } from "../../common/interval_map.js";
import { RSA } from "../../common/rsa.js";
import { BlockchainElement } from "../../model/blockchain/blockchain.js";
import { Consensus } from "./consensus.js";

export class ProofOfBurnConsensus extends Consensus {

    constructor(network) {
        super(network);
    }

    constructValidLeadingBlock(currentlyLeadingBlock, potentialyNextBlock) {
        if (this.isBlockValid(currentlyLeadingBlock, potentialyNextBlock)) {
            return this.createBlockchainElement(currentlyLeadingBlock, potentialyNextBlock);
        } else {
            return null;
        }
    }

    canAddressConstructNewBlock(currentlyLeadingBlock, potentialyConstructingAddress, timestamp) {
        return this.getMiners(currentlyLeadingBlock, timestamp).get(timestamp % this.network.settings.roundTime) === potentialyConstructingAddress;
    }

    isBlockValid(previousBlock, block) {
        return this.isBlockGenesisBlock(previousBlock, block)
            || (this.isBlockPredecessorValid(previousBlock, block)
                && this.isBlockHeightValid(previousBlock, block)
                && this.isBlockTimestampValid(previousBlock, block)
                && this.isBlockHashValid(block)
                && this.areTransactionsValid(block.blockBody.transactions, block.blockBody.creationTimestamp, previousBlock));
    }

    isBlockPredecessorValid(previousBlock, block) {
        return previousBlock.block.isPreviousFor(block)
    }

    isBlockGenesisBlock(previousBlock, block) {
        return previousBlock === null && block.equals(this.network.settings.genesisBlock);
    }

    isBlockHeightValid(previousBlock, block) {
        return previousBlock.block.blockBody.height + 1 === block.blockBody.height;
    }

    isBlockTimestampValid(previousBlock, block) {
        return block.blockBody.creationTimestamp <= this.network.timer.currentTimestamp
            && previousBlock.block.blockBody.creationTimestamp < block.blockBody.creationTimestamp;
    }

    isBlockHashValid(block) {
        return CryptoJS.SHA256(JSON.stringify(block.blockBody)).toString() === block.blockHash;
    }

    areTransactionsValid(transactions, blockCreationTimestamp, previousBlock) {
        var { miningAward, roundTime, maxTransactionsPerBlock } = this.network.settings;

        if (transactions.length > maxTransactionsPerBlock) {
            return false;
        }

        var awardTransactions = transactions.filter(transaction => transaction.transactionBody.sourceAddress === null)
        if (awardTransactions.length !== 1
            || awardTransactions[0].transactionBody.amount !== miningAward) {
            return false;
        }

        var miners = this.getMiners(previousBlock, blockCreationTimestamp);
        var currentMiner = miners.get(blockCreationTimestamp % roundTime);
        if (currentMiner !== awardTransactions[0].transactionBody.targetAddress.toString(16)) {
            return false;
        }

        var awardTransactionIndex = transactions.indexOf(awardTransactions[0]);
        return transactions.every((transaction, index) => this.isTransactionValid(transaction, index === awardTransactionIndex, blockCreationTimestamp, previousBlock.lastTransactionIds));
    }

    isTransactionValid(transaction, asAwardTransaction, blockCreationTimestamp, lastTransactionIds) {
        return this.isTransactionAmountValid(transaction)
            && this.isTransactionTimestampValid(transaction, blockCreationTimestamp)
            && this.isTransactionAddressesValid(transaction, asAwardTransaction)
            && this.isTransactionIdValid(transaction, lastTransactionIds)
            && this.isTransactionHashValid(transaction)
            && this.isTransactionSignatureValid(transaction);
    }

    isTransactionAmountValid(transaction) {
        return transaction.transactionBody.amount > 0;
    }

    isTransactionTimestampValid(transaction, blockCreationTimestamp) {
        return transaction.transactionBody.validTo >= blockCreationTimestamp;
    }

    isTransactionAddressesValid(transaction, asAwardTransaction) {
        var { sourceAddress, targetAddress } = transaction.transactionBody;
        var burnAddress = this.network.walletPool.getBurnAddress();

        if (asAwardTransaction) {
            return sourceAddress === null;
        } else {
            return sourceAddress !== null
                && sourceAddress.toString(16) !== targetAddress.toString(16)
                && sourceAddress.toString(16) !== burnAddress.toString(16);
        }
    }

    isTransactionIdValid(transaction, lastTransactionIds) {
        if (transaction.transactionBody.sourceAddress) {
            var lastId = lastTransactionIds.get(transaction.transactionBody.sourceAddress.toString(16)) || 0;
            return transaction.transactionBody.id > lastId;
        } else {
            return true;
        }
    }

    isTransactionHashValid(transaction) {
        return CryptoJS.SHA256(JSON.stringify(transaction.transactionBody)).toString() === transaction.transactionHash;
    }

    isTransactionSignatureValid(transaction) {
        return RSA.verifySignature(transaction.transactionBody, transaction.signature, transaction.transactionBody.sourceAddress || transaction.transactionBody.targetAddress)
    }

    getMiners(currentlyLeadingBlock, nextBlockCreationTimestamp) {
        var currentBlock = currentlyLeadingBlock;
        while (!this.areFromDifferentRounds(currentBlock.block.blockBody.creationTimestamp, nextBlockCreationTimestamp)) {
            currentBlock = currentBlock.previousBlock;
        };
        return currentBlock.nextRoundMiners;
    }

    calculateMiners(leadingBlock) {
        var minersPerRound = this.network.settings.minersPerRound;
        var lastBlocks = [];
        var currentBlock = leadingBlock;
        while (lastBlocks.length < 2 * minersPerRound && currentBlock !== null) {
            lastBlocks.unshift(currentBlock.block);
            currentBlock = currentBlock.previousBlock;
        }

        var seedInputBlocks = lastBlocks.slice(0, minersPerRound);

        var seed = seedInputBlocks.map(block => parseInt(block.blockHash[1], 16) % 2).join('')
            + seedInputBlocks[seedInputBlocks.length - 1].blockBody.height;


        var timeQuantum = this.network.settings.roundTime / minersPerRound;
        var minersMap = new DiscreteIntervalMap();

        [...Array(minersPerRound).keys()]
            .map((_, index) => CryptoJS.SHA256(seed + index).toString())
            .map(hash => bigInt(hash, 16))
            .map(number => number.mod(leadingBlock.burnMap.summedInvervalsSize))
            .map(leadingBlock.burnMap.get.bind(leadingBlock.burnMap))
            .map(Vue.toRaw)
            .forEach(minerAddress => minersMap.push(timeQuantum, minerAddress));

        return minersMap;
    }

    createBlockchainElement(previousBlockchainElement, block) {
        var burnAddress = this.network.walletPool.getBurnAddress();

        var element = new BlockchainElement(block, previousBlockchainElement);
        element.burnMap = previousBlockchainElement ? new DiscreteIntervalMap(previousBlockchainElement.burnMap) : new DiscreteIntervalMap();
        element.accountMap = previousBlockchainElement ? new Map(previousBlockchainElement.accountMap) : new Map();
        element.spendableTokensSupply = previousBlockchainElement ? previousBlockchainElement.spendableTokensSupply : 0;
        element.lastTransactionIds = previousBlockchainElement ? new Map(previousBlockchainElement.lastTransactionIds) : new Map();

        block.blockBody.transactions.forEach(transaction => {
            var { id, sourceAddress, targetAddress, amount } = transaction.transactionBody;

            if (targetAddress.equals(burnAddress)) {
                element.burnMap.push(amount, sourceAddress.toString(16));
                element.spendableTokensSupply -= amount;
            }


            if (sourceAddress) {
                var inputBalance = element.accountMap.get(sourceAddress.toString(16)) || 0;
                element.accountMap.set(sourceAddress.toString(16), inputBalance - amount);

                var lastTransactionId = element.lastTransactionIds.get(sourceAddress.toString(16)) || 0;
                if (id > lastTransactionId) {
                    element.lastTransactionIds.set(sourceAddress.toString(16), id);
                }
            } else {
                var lastTransactionId = element.lastTransactionIds.get(targetAddress.toString(16)) || 0;
                if (id > lastTransactionId) {
                    element.lastTransactionIds.set(targetAddress.toString(16), id);
                }
                element.spendableTokensSupply += amount;
            }

            var outputBalance = element.accountMap.get(targetAddress.toString(16)) || 0;
            element.accountMap.set(targetAddress.toString(16), outputBalance + amount);
        });

        element.accountMap.delete(burnAddress.toString(16));

        element.nextRoundMiners = this.calculateMiners(element);

        return element;
    }

    areFromDifferentRounds(previousBlockCreationTimestamp, blockCreationTimestamp) {
        var { roundTime } = this.network.settings;
        return Math.floor(blockCreationTimestamp / roundTime) >
            Math.floor((previousBlockCreationTimestamp / roundTime));
    }

}