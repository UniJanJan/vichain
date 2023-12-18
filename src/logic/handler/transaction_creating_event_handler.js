import { EventHandler } from "./event_handler.js";

export class TransactionCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        var accountService = this.serviceDispositor.getAccountService(processingNode);
        var transactionService = this.serviceDispositor.getTransactionService(processingNode);

        var transaction = transactionService.createTransaction(processedEvent.sourceWallet, processedEvent.targetAddress, processedEvent.amount);

        
        if (transactionService.putUncommittedTransaction(transaction)) {
            accountService.addRelatedTransaction(transaction);
        }

        return [
            this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
        ];
    }

}