import { RSA } from "../../common/rsa.js";
import { EventHandler } from "./event_handler.js";

export class TransactionVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        var transaction = processedEvent.transaction;
        if (!processingNode.transactionPool.contains(transaction) && this.isTransactionValid(transaction)) {
            processingNode.transactionPool.put(transaction);
            return [
                this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
            ];
        } else {
            return [];
        }
    }

    isTransactionValid(transaction) {
        var transactionPayload = transaction.sourceAddress.toString() + transaction.targetAddress.toString() + transaction.amount;
        return RSA.verifySignature(transactionPayload, transaction.signature, transaction.sourceAddress);
    }
}