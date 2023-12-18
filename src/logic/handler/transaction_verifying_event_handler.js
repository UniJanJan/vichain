import { RSA } from "../../common/rsa.js";
import { EventHandler } from "./event_handler.js";

export class TransactionVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        var transaction = processedEvent.transaction;
        var transactionService = this.serviceDispositor.getTransactionService(processingNode);
        if (transactionService.isTransactionValid(transaction, false)) {

            if (transactionService.putUncommittedTransaction(transaction)) {
                var accountService = this.serviceDispositor.getAccountService(processingNode);
                accountService.addRelatedTransaction(transaction);
            }

            return [
                this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction, [processedEvent.informatorNode])
            ];
        } else {
            return [];
        }
    }

}