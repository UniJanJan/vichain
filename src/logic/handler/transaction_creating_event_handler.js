import { RSA } from "../../common/rsa.js";
import { Transaction } from "../../model/transaction/transaction.js";
import { TransactionBody } from "../../model/transaction/transaction_body.js";
import { EventHandler } from "./event_handler.js";

export class TransactionCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        var transaction = this.createSignedTransaction(processedEvent);

        processingNode.transactionPool.put(transaction);
        
        return [
            this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
        ];
    }

    createSignedTransaction(processedEvent) {
        var transactionBody = new TransactionBody(processedEvent.sourceWallet.publicKey, processedEvent.targetAddress, processedEvent.amount);
        var signature = RSA.createSignature(transactionBody, processedEvent.sourceWallet.privateKey, processedEvent.sourceWallet.publicKey);
        return new Transaction(transactionBody, signature);
    }
}