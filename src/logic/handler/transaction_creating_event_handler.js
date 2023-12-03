import { RSA } from "../../common/rsa.js";
import { Transaction } from "../../model/transaction/transaction.js";
import { EventHandler } from "./event_handler.js";

export class TransactionCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        var transactionPayload = processedEvent.sourceWallet.publicKey.toString() + processedEvent.targetAddress.toString() + processedEvent.amount;
        var signature = RSA.createSignature(transactionPayload, processedEvent.sourceWallet.privateKey, processedEvent.sourceWallet.publicKey);
        
        var transaction = new Transaction(processedEvent.sourceWallet.publicKey, processedEvent.targetAddress, processedEvent.amount, signature);
        processingNode.transactionPool.put(transaction);
        return [
            this.eventFactory.createTransactionBroadcastEvent(processingNode, transaction)
        ];
    }
}