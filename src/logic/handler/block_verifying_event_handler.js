import { EventHandler } from "./event_handler.js";

export class BlockVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) { //TODO
        var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);
        if (blockchainService.isBlockValid(processedEvent.block)) {
            // processingNode.blockchain.getBlockByHashAndHeight(processedEvent.block.blockHash, processedEvent.block.blockBody.height - 1);

            blockchainService.appendBlock(processedEvent.block);

            var transactionService = this.serviceDispositor.getTransactionService(processingNode);
            transactionService.dropTransactions(processedEvent.block.blockBody.transactions);

            if (processedEvent.block.blockBody.height === 0) {
                return [];
            } else {
                return [
                    this.eventFactory.createBlockBroadcastEvent(processingNode, processedEvent.block)
                ];
            }

        } else {
            return [];
        }
    }

}