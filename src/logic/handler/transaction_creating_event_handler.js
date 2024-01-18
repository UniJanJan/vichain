import { EventHandler } from "./event_handler.js";

export class TransactionCreatingEventHandler extends EventHandler {

    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent, baton) {
        var accountService = this.serviceDispositor.getAccountService(processingNode);
        var transactionService = this.serviceDispositor.getTransactionService(processingNode);

        var transaction = transactionService.createTransaction(processedEvent.sourceWallet, processedEvent.targetAddress, processedEvent.amount);

        
        if (transactionService.putUncommittedTransaction(transaction)) {
            accountService.addRelatedTransaction(transaction);
        }

        baton.nextProcessableEvents.push(
            this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
        );
    }

}