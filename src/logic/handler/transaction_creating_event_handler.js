import { EventHandler } from "./event_handler.js";

export class TransactionCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        var accountService = this.serviceDispositor.getAccountService(processingNode);
        var transactionService = this.serviceDispositor.getTransactionService(processingNode);

        var sourceAccount = accountService.getManagedAccount(processedEvent.sourceWallet.publicKey);
        var transaction = transactionService.createTransaction(sourceAccount, processedEvent.targetAddress, processedEvent.amount);

        
        if (transactionService.putUncommittedTransaction(transaction) && processingNode.transactionPool.contains(transaction)) {
            accountService.updateAvailableBalance(transaction);
        }

        return [
            this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
        ];
    }

}