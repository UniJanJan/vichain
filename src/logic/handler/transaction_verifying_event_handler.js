import { RSA } from "../../common/rsa.js";
import { EventHandler } from "./event_handler.js";

export class TransactionVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        var transaction = processedEvent.transaction;
        var transactionService = this.serviceDispositor.getTransactionService(processingNode);
        if (!processingNode.transactionPool.contains(transaction) && transactionService.isTransactionValid(transaction)) {
            if (transactionService.putUncommittedTransaction(transaction) && processingNode.transactionPool.contains(transaction)) {
                var accountService = this.serviceDispositor.getAccountService(processingNode);
                accountService.updateAvailableBalance(transaction);
            }

            return [
                this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction, [processedEvent.informatorNode])
            ];
        } else {
            return [];
        }
    }

}