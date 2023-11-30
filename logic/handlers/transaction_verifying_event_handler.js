import { EventHandler } from "./event_handler.js";

export class TransactionVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        var transaction = processedEvent.transaction;
        if (!processingNode.transactionPool.contains(transaction)) {
            processingNode.transactionPool.put(transaction);
            return [
                this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
            ];
        } else {
            return [];
        }
    }
}