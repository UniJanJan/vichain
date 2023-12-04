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
        return RSA.verifySignature(transaction.transactionBody, transaction.signature, transaction.transactionBody.sourceAddress);
    }
}