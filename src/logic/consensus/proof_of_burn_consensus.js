import { IntervalMap } from "../../common/interval_map.js";
import { RSA } from "../../common/rsa.js";
import { BlockchainElement } from "../../model/blockchain/blockchain.js";
import { Consensus } from "./consensus.js";

export class ProofOfBurnConsensus extends Consensus {

    constructor(network) {
        super(network);

        this.hashCache = new Map();
    }

    constructValidLeadingBlock(currentlyLeadingBlock, potentialyNextBlock) {
        if (this.isBlockValid(currentlyLeadingBlock, potentialyNextBlock)) {
            var blockchainElement = this.createBlockchainElement(currentlyLeadingBlock, potentialyNextBlock);
            return this.areAddressBalancesValid(blockchainElement.accountMap) ? blockchainElement : null;
        } else {
            return null;
        }
    }

    canAddressConstructNewBlock(currentlyLeadingBlock, potentialyConstructingAddress, timestamp) {
        var miners = this.getMiners(currentlyLeadingBlock, timestamp)
        if (miners) {
            return miners.get(timestamp % this.network.settings.roundTime) === potentialyConstructingAddress;
        } else {
            return false;
        }
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
        if (awardTransactions.length !== 1) {
            return false;
        }

        var miners = this.getMiners(previousBlock, blockCreationTimestamp);
        var currentMiner = miners.get(blockCreationTimestamp % roundTime);
        if (currentMiner !== awardTransactions[0].transactionBody.targetAddress) {
            return false;
        }

        var awardTransactionIndex = transactions.indexOf(awardTransactions[0]);
        return transactions.every((transaction, index) => this.isTransactionValid(transaction, index === awardTransactionIndex, blockCreationTimestamp, previousBlock.lastTransactionIds));
    }

    isTransactionValid(transaction, asAwardTransaction, blockCreationTimestamp, lastTransactionIds) {
        return this.isTransactionAmountValid(transaction, asAwardTransaction)
            && this.isTransactionTimestampValid(transaction, blockCreationTimestamp)
            && this.areTransactionAddressesValid(transaction, asAwardTransaction)
            && this.isTransactionIdValid(transaction, lastTransactionIds)
            && this.isTransactionHashValid(transaction)
            && this.isTransactionSignatureValid(transaction, asAwardTransaction);
    }

    isTransactionAmountValid(transaction, asAwardTransaction) {
        var amount = transaction.transactionBody.amount;
        if (asAwardTransaction) {
            return amount === this.network.settings.miningAward;
        } else {
            return Number.isSafeInteger(amount) && amount > 0;
        }
    }

    isTransactionTimestampValid(transaction, blockCreationTimestamp) {
        return transaction.transactionBody.validTo >= blockCreationTimestamp;
    }

    areTransactionAddressesValid(transaction, asAwardTransaction) {
        var { sourceAddress, targetAddress } = transaction.transactionBody;
        var burnAddress = this.network.walletPool.getBurnAddress();

        if (asAwardTransaction) {
            return sourceAddress === null;
        } else {
            return sourceAddress !== null
                && sourceAddress !== targetAddress
                && sourceAddress !== burnAddress;
        }
    }

    isTransactionIdValid(transaction, lastTransactionIds) {
        if (transaction.transactionBody.sourceAddress) {
            var lastId = lastTransactionIds.get(transaction.transactionBody.sourceAddress) || 0;
            return transaction.transactionBody.id > lastId;
        } else {
            return true;
        }
    }

    isTransactionHashValid(transaction) {
        var hashableData = JSON.stringify(transaction.transactionBody);
        var transactionHash = this.hashCache.get(hashableData);
        if (!transactionHash) {
            transactionHash = CryptoJS.SHA256(hashableData).toString();
            this.hashCache.set(hashableData, transactionHash);
        }
        return transactionHash === transaction.transactionHash;
    }

    isTransactionSignatureValid(transaction, asAwardTransaction) {
        if (asAwardTransaction) {
            return RSA.verifySignature(transaction.transactionHash, transaction.signature, transaction.transactionBody.targetAddress);
        } else {
            return RSA.verifySignature(transaction.transactionHash, transaction.signature, transaction.transactionBody.sourceAddress);
        }
    }

    getMiners(currentlyLeadingBlock, nextBlockCreationTimestamp) {
        var currentBlock = currentlyLeadingBlock;
        while (!this.areFromDifferentRounds(currentBlock.block.blockBody.creationTimestamp, nextBlockCreationTimestamp)) {
            currentBlock = currentBlock.previousBlock;
            if (currentBlock === null) {
                return null;
            }
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
        var minersMap = new IntervalMap();

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
        element.burnMap = previousBlockchainElement ? previousBlockchainElement.burnMap.clone() : new IntervalMap();
        element.accountMap = previousBlockchainElement ? new Map(previousBlockchainElement.accountMap) : new Map();
        element.spendableTokensSupply = previousBlockchainElement ? previousBlockchainElement.spendableTokensSupply : 0;
        element.lastTransactionIds = previousBlockchainElement ? new Map(previousBlockchainElement.lastTransactionIds) : new Map();

        block.blockBody.transactions.forEach(transaction => {
            var { id, sourceAddress, targetAddress, amount } = transaction.transactionBody;

            if (targetAddress === burnAddress) {
                element.burnMap.push(amount, sourceAddress);
                element.spendableTokensSupply -= amount;
            }


            if (sourceAddress) {
                var inputBalance = element.accountMap.get(sourceAddress) || 0;
                element.accountMap.set(sourceAddress, inputBalance - amount);

                var lastTransactionId = element.lastTransactionIds.get(sourceAddress) || 0;
                if (id > lastTransactionId) {
                    element.lastTransactionIds.set(sourceAddress, id);
                }
            } else {
                var lastTransactionId = element.lastTransactionIds.get(targetAddress) || 0;
                if (id > lastTransactionId) {
                    element.lastTransactionIds.set(targetAddress, id);
                }
                element.spendableTokensSupply += amount;
            }

            var outputBalance = element.accountMap.get(targetAddress) || 0;
            element.accountMap.set(targetAddress, outputBalance + amount);
        });

        element.accountMap.delete(burnAddress);

        element.nextRoundMiners = this.calculateMiners(element);

        return element;
    }

    areFromDifferentRounds(previousBlockCreationTimestamp, blockCreationTimestamp) {
        var { roundTime } = this.network.settings;
        return Math.floor(blockCreationTimestamp / roundTime) >
            Math.floor((previousBlockCreationTimestamp / roundTime));
    }

    areAddressBalancesValid(balanceMap) {
        return Array.from(balanceMap.values()).every(balance => balance >= 0);
    }

}