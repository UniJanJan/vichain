import { EventHandler } from "./event_handler.js";

export class BlockCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        // TODO currentlyLeading probably has been changed because of other miners
        var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);
        var currentlyLeadingBlock = blockchainService.getBlockByHashAndHeight(processedEvent.leadingBlock.block.blockHash, processedEvent.leadingBlock.block.blockBody.height);
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

        var transactionService = this.serviceDispositor.getTransactionService(processingNode);
        transactionService.dropStaleTransactions();

        var accountService = this.serviceDispositor.getAccountService(processingNode);
        var minerAccount = accountService.getManagedAccount(processedEvent.selectedAddress);
        var transactions = transactionService.pickUncommittedTransactions(this.network.settings.maxTransactionsPerBlock - 1);
        var awardTransaction = transactionService.createAwardTransaction(minerAccount);
        transactions.push(awardTransaction);

        var leadingBlock = processingNode.blockchain.leadingBlocks[leadingBlockIndex];
        var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);
        var newBlock = blockchainService.createBlock(leadingBlock.block, transactions);
        blockchainService.appendBlock(newBlock);

        return [
            this.eventFactory.createBlockBroadcastEvent(processingNode, newBlock)
        ];
    }
}