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

export class BlockWrapper {
    constructor(block, previousBlock, burnAddress) {
        this.block = block;
        this.previousBlock = previousBlock;
        this.burnMap = previousBlock ? new DiscreteIntervalMap(previousBlock.burnMap) : new DiscreteIntervalMap();
        this.accountMap = previousBlock ? new Map(previousBlock.accountMap) : new Map();
        this.spendableTokensSupply = previousBlock ? previousBlock.spendableTokensSupply : 0;

        this.block.blockBody.transactions.forEach(transaction => {
            var { sourceAddress, targetAddress, amount } = transaction.transactionBody;

            if (targetAddress.equals(burnAddress)) {
                this.burnMap.push(amount, sourceAddress.toString(16));
                this.spendableTokensSupply -= amount;
            }


            if (sourceAddress) {
                var inputBalance = this.accountMap.get(sourceAddress.toString(16)) || 0;
                this.accountMap.set(sourceAddress.toString(16), inputBalance - amount);
            } else {
                this.spendableTokensSupply += amount;
            }

            var outputBalance = this.accountMap.get(targetAddress.toString(16)) || 0;
            this.accountMap.set(targetAddress.toString(16), outputBalance + amount);
        });

        this.accountMap.delete(burnAddress.toString(16));
    }
}