import { Transaction } from "../../transaction.js";
import { EventHandler } from "./event_handler.js";

export class TransactionCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        var transaction = new Transaction(processedEvent.sourceAddress, processedEvent.targetAddress, processedEvent.amount);
        processingNode.transactionPool.put(transaction);
        return [
            this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
        ];
    }
}