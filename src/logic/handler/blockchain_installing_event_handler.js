import { Block } from "../../model/blockchain/block.js";
import { BlockBody } from "../../model/blockchain/block_body.js";
import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { Transaction } from "../../model/transaction/transaction.js";
import { TransactionBody } from "../../model/transaction/transaction_body.js";
import { EventHandler } from "./event_handler.js";

export class BlockchainInstallingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNetwork, processedEvent) {
        var nextProcessableEvents = [];
        // var initTokenAmount = 1000;
        var initTokenAmountPerNode = 100;
        var transactions = [];

        processedEvent.nodes.forEach(node => {
            var newWallet = processingNetwork.walletPool.addRandomWallet();
            node.knownWallets.push(newWallet);

            var incomeTransaction = new Transaction(new TransactionBody(null, newWallet.publicKey, initTokenAmountPerNode + 1), null);
            transactions.push(incomeTransaction);

            var burnTransaction = new Transaction(new TransactionBody(newWallet.publicKey, processingNetwork.walletPool.getBurnAddress(), 1), null);
            transactions.push(burnTransaction);
        });

        var genesisBlockBody = new BlockBody(0, null, transactions);
        var genesisBlock = new Block(genesisBlockBody, CryptoJS.SHA256(JSON.stringify(genesisBlockBody)));

        processedEvent.nodes.forEach(node => {
            // node.knownAddresses = 
            node.blockchain.appendBlock(genesisBlock);
            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTION_GENERATION, Math.random() * 10000));
        });
        return nextProcessableEvents;
    }
}