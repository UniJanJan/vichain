import { EventHandler } from "./event_handler.js";

export class TransactionVerifyingEventHandler extends EventHandler {
    
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent, baton) {
        var transaction = processedEvent.transaction;
        var transactionService = this.serviceDispositor.getTransactionService(processingNode);
        if (transactionService.isTransactionValid(transaction, false)) {

            if (transactionService.putUncommittedTransaction(transaction)) {
                var accountService = this.serviceDispositor.getAccountService(processingNode);
                accountService.addRelatedTransaction(transaction);

                baton.nextProcessableEvents.push(
                    this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction, processedEvent.informedNodes)
                )
            }

        }
    }

}