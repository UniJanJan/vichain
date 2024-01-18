import { EventHandler } from "./event_handler.js";

export class BlockVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent, baton) {
        var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);

        var nextProcessableEvents = [];

        var nextBlock = processedEvent.blocksToVerify[0];
        processedEvent.leadingBlocks.forEach(leadingBlock => {
            var validLeadingBlock = blockchainService.constructValidLeadingBlock(leadingBlock, nextBlock);
            if (validLeadingBlock !== null) {
                if (processedEvent.blocksToVerify.length > 1) {
                    nextProcessableEvents.push(
                        this.eventFactory.createBlockVerifyingEvent(processingNode, [validLeadingBlock], processedEvent.blocksToVerify.slice(1), processedEvent.informedNodes)
                    );
                }
            }

            var insertableBlock = validLeadingBlock || leadingBlock;
            var accountService = this.serviceDispositor.getAccountService(processingNode);
            accountService.updateRelatedTransactions(insertableBlock);

            var isAppended = blockchainService.appendBlock(insertableBlock);
            var blockchainHeight = blockchainService.getBlockchainHeight();
            if (isAppended) {
                var transactionService = this.serviceDispositor.getTransactionService(processingNode);
                transactionService.updateTransactionPool(insertableBlock);
                accountService.dropUnnecessaryAccountHistories();

                if (blockchainHeight > 0) {
                    nextProcessableEvents.push(
                        this.eventFactory.createBlockBroadcastEvent(processingNode, insertableBlock.block, processedEvent.informedNodes)
                    );
                }
                baton.isBlockAppended = true;
            }

        })

        baton.verifiedBlock = nextBlock;
        baton.currentlyLeadingBlocks = blockchainService.getLeadingBlocks();
        baton.nextProcessableEvents = nextProcessableEvents;

        return []; //nextProcessableEvents;
    }

}