import { RSA } from "../../common/rsa.js";
import { EventHandler } from "./event_handler.js";

export class TransactionVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        var transaction = processedEvent.transaction;
        if (!processingNode.transactionPool.contains(transaction) && this.isTransactionValid(transaction)) {
            var transactionService = this.serviceDispositor.getTransactionService(processingNode);

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

    isTransactionValid(transaction) {
        return !transaction.transactionBody.sourceAddress.equals(transaction.transactionBody.targetAddress) &&
            !transaction.transactionBody.sourceAddress.equals(this.network.walletPool.getBurnAddress()) &&
            RSA.verifySignature(transaction.transactionBody, transaction.signature, transaction.transactionBody.sourceAddress);
    }
}