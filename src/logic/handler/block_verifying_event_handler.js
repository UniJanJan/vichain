import { EventHandler } from "./event_handler.js";

export class BlockVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) { //TODO
        if (processingNode.blockchain.getBlockByHashAndHeight(processedEvent.block.blockHash, processedEvent.block.blockBody.height) === null
            && this.isBlockValid(processedEvent.block)) {
            // processingNode.blockchain.getBlockByHashAndHeight(processedEvent.block.blockHash, processedEvent.block.blockBody.height - 1);

            var burnAddress = this.network.walletPool.getBurnAddress();
            processingNode.blockchain.appendBlock(processedEvent.block, burnAddress);

            processedEvent.block.blockBody.transactions.forEach(transaction => {
                if (processingNode.transactionPool.contains(transaction)) {
                    processingNode.transactionPool.remove(transaction);
                }
            });

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

    isBlockValid(block) {
        return true; // TODO
    }
}