import { RSA } from "../../common/rsa.js";
import { Block } from "../../model/blockchain/block.js";
import { BlockBody } from "../../model/blockchain/block_body.js";
import { Transaction } from "../../model/transaction/transaction.js";
import { TransactionBody } from "../../model/transaction/transaction_body.js";
import { EventHandler } from "./event_handler.js";

export class BlockCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        var leadingBlockIndex = processingNode.blockchain.leadingBlocks.indexOf(processedEvent.leadingBlock);
        if (leadingBlockIndex === -1) {
            throw new Error('Leading block not found in blockchain of ' + processingNode);
        }

        var leadingBlock = processingNode.blockchain.leadingBlocks[leadingBlockIndex];
        var wallet = processingNode.knownWallets.filter(knownWallet => knownWallet.publicKey.equals(processedEvent.selectedAddress))[0];
        var transactions = processingNode.transactionPool.pick(this.network.settings.maxTransactionsPerBlock - 1);
        var awardTransactionBody = new TransactionBody(null, wallet.publicKey, this.network.settings.miningAward); // award TODO
        var signature = RSA.createSignature(awardTransactionBody, wallet.privateKey, wallet.publicKey);
        transactions.push(new Transaction(awardTransactionBody, signature));

        var newBlockBody = new BlockBody(leadingBlock.block.blockBody.height + 1, leadingBlock.block.blockHash, transactions);
        var newBlock = new Block(newBlockBody, CryptoJS.SHA256(JSON.stringify(newBlockBody)), leadingBlock.block);

        leadingBlock.block = newBlock;

        var burnAddress = this.network.walletPool.getBurnAddress();
        transactions.forEach(transaction => {
            if (transaction.transactionBody.targetAddress.equals(burnAddress)) {
                leadingBlock.burnMap.push(transaction.transactionBody.amount, transaction.transactionBody.sourceAddress);
            }
        });

        return [this.eventFactory.createBlockBroadcastEvent(processingNode, newBlock)];
    }
}