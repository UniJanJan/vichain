import { Block } from "../../model/blockchain/block.js";
import { BlockBody } from "../../model/blockchain/block_body.js";
import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { EventHandler } from "./event_handler.js";

export class BlockchainInstallingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNetwork, processedEvent) {
        if (this.network.settings.isBlockchainInstalled) {
            throw new Error("Blockchain has been installed yet!");
        }

        if (this.network.nodes.length === 0) {
            throw new Error("Lack of nodes to install blockchain on!");
        }

        this.network.settings.isBlockchainInstalled = true;

        var transactions = [];

        processedEvent.nodes.forEach(node => {
            var accountService = this.serviceDispositor.getAccountService(node);
            var newAccount = accountService.createAccount();


            var transactionService = this.serviceDispositor.getTransactionService(node);

            var gainAmount = processingNetwork.settings.initTokenAmountPerNode + 1;

            var incomeTransaction = transactionService.createAwardTransaction(newAccount.wallet, gainAmount, -2);
            var burnTransaction = transactionService.createBurnTransaction(newAccount.wallet, 1, -1);

            transactions.push(incomeTransaction);
            transactions.push(burnTransaction);
        });

        var currentTimestamp = this.network.timer.currentTimestamp;

        var genesisBlockBody = new BlockBody(0, null, transactions, currentTimestamp);
        var genesisBlock = new Block(genesisBlockBody, CryptoJS.SHA256(JSON.stringify(genesisBlockBody)), null);

        this.network.settings.genesisBlock = genesisBlock;

        var { roundTime } = this.network.settings;
        var timeToNextRound = roundTime - (currentTimestamp % roundTime) + 1000;

        return processedEvent.nodes.flatMap(node => [
            this.eventFactory.createBlockVerifyingEvent(node, [null], [genesisBlock], this.network.nodes),
            this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTION_GENERATION, Math.random() * 10000),
            this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTIONS_DISCOVERY, 0),
            this.eventFactory.createWaitingEvent(node, CyclicEventsName.MINERS_SELECTION, timeToNextRound)
        ]);
    }
}