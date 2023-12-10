import { Block } from "../../model/blockchain/block.js";
import { BlockBody } from "../../model/blockchain/block_body.js";
import { EventHandler } from "./event_handler.js";

export class BlockCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        // TODO currentlyLeading probably has been changed because of other miners
        var currentlyLeadingBlock = processingNode.blockchain.getBlockByHashAndHeight(processedEvent.leadingBlock.block.blockHash, processedEvent.leadingBlock.block.blockBody.height);
        if (currentlyLeadingBlock !== null) {
            currentlyLeadingBlock = currentlyLeadingBlock.leadingBlock;
        } else {
            // longer chain appeared
            return [];
        }
        // var leadingBlockIndex = processingNode.blockchain.leadingBlocks.indexOf(processedEvent.leadingBlock);
        var leadingBlockIndex = processingNode.blockchain.leadingBlocks.indexOf(currentlyLeadingBlock);
        if (leadingBlockIndex === -1) {
            throw new Error('Leading block not found in blockchain of ' + processingNode);
        }

        var currentTimestamp = this.network.timer.currentTimestamp;
        processingNode.transactionPool.dropStaleTransactions(currentTimestamp);

        var leadingBlock = processingNode.blockchain.leadingBlocks[leadingBlockIndex];

        var accountService = this.serviceDispositor.getAccountService(processingNode);
        var minerAccount = accountService.getManagedAccount(processedEvent.selectedAddress);
        var transactions = processingNode.transactionPool.pick(this.network.settings.maxTransactionsPerBlock - 1);
        var transactionService = this.serviceDispositor.getTransactionService(processingNode);
        var awardTransaction = transactionService.createAwardTransaction(minerAccount);
        transactions.push(awardTransaction);

        var newBlockBody = new BlockBody(leadingBlock.block.blockBody.height + 1, leadingBlock.block.blockHash, transactions, currentTimestamp);
        var newBlock = new Block(newBlockBody, CryptoJS.SHA256(JSON.stringify(newBlockBody)));

        var burnAddress = this.network.walletPool.getBurnAddress();
        processingNode.blockchain.appendBlock(newBlock, burnAddress);

        return [
            this.eventFactory.createBlockBroadcastEvent(processingNode, newBlock)
        ];
    }
}