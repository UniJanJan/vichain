import { EventHandler } from "./event_handler.js";

export class BlockCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);
        var leadingBlock = processedEvent.leadingBlock;
        var isStillLeading = processingNode.blockchain.leadingBlocks.includes(leadingBlock);
        if (!isStillLeading) {
            //throw new Error('Leading block not found in blockchain of ' + processingNode);
            return []
        }

        var transactionService = this.serviceDispositor.getTransactionService(processingNode);
        transactionService.dropStaleTransactions();

        var accountService = this.serviceDispositor.getAccountService(processingNode);
        var minerAccount = accountService.getManagedAccount(processedEvent.selectedAddress);
        var transactions = transactionService.pickUncommittedTransactions(leadingBlock.accountMap, this.network.settings.maxTransactionsPerBlock - 1);
        var awardTransaction = transactionService.createAwardTransaction(minerAccount.wallet);
        transactions.push(awardTransaction);

        var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);
        var newBlock = blockchainService.createBlock(leadingBlock.block, transactions);
        var nextLeadingBlock = blockchainService.constructValidLeadingBlock(leadingBlock, newBlock);

        if (nextLeadingBlock !== null) {
            var isAppended = blockchainService.appendBlock(nextLeadingBlock);
            if (isAppended) {
                transactionService.updateTransactionPool(nextLeadingBlock);
                accountService.updateRelatedTransactions(nextLeadingBlock);
                accountService.dropUnnecessaryAccountHistories();
            }
        }


        return [
            this.eventFactory.createBlockBroadcastEvent(processingNode, newBlock)
        ];
    }
}