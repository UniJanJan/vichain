import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { AddrMessage } from "../../model/message/addr_message.js";
import { GetBlocksMessage } from "../../model/message/get_blocks_message.js";
import { GetTransactionsMessage } from "../../model/message/get_transactions_message.js";
import { GetAddrMessage } from "../../model/message/getaddr_message.js";
import { EventHandler } from "./event_handler.js";

export class WaitingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
    }

    handle(processingNode, processedEvent) {
        switch (processedEvent.name) {
            case CyclicEventsName.SENDING_ADDRESS:
                return [
                    this.eventFactory.createMessageBroadcastEvent(processingNode, new AddrMessage(this.networkInterface.getAllLinkableNodes())),
                    this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.SENDING_ADDRESS, 360000)
                ];
            case CyclicEventsName.PEERS_DISCOVERY:
                var waitTime = this.getPeersDiscoveryTimeInterval.bind(this)(processingNode);

                if (processingNode.networkInterface.getAllEstablishedLinkedNodes().length > 0) {
                    return [
                        ...this.eventFactory.createLinksUpdateEvents(this.network, processingNode),
                        this.eventFactory.createMessageBroadcastEvent(processingNode, new GetAddrMessage()),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.PEERS_DISCOVERY, waitTime)
                    ];
                } else {
                    return [
                        ...this.eventFactory.createLinksUpdateEvents(this.network, processingNode),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.PEERS_DISCOVERY, waitTime)
                    ];
                }
            case CyclicEventsName.TRANSACTIONS_DISCOVERY:
                // var waitTime = this.getTimeInterval(this.network.settings.minTransactionsDiscoveryInterval, this.network.settings.avgTransactionsDiscoveryInterval);

                if (processingNode.transactionPool.transactions.length < 3) {
                    return [
                        this.eventFactory.createMessageBroadcastEvent(processingNode, new GetTransactionsMessage()),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTIONS_DISCOVERY, 20000)
                    ]
                } else {
                    return [
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTIONS_DISCOVERY, 10000)
                    ]
                }
            case CyclicEventsName.BLOCKS_DISCOVERY:
                if (processingNode.blockchain.leadingBlocks.length > 0 && processingNode.blockchain.leadingBlocks[0].block.blockBody.height === 0) { // TODO
                    return [
                        this.eventFactory.createMessageBroadcastEvent(processingNode, new GetBlocksMessage()),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.BLOCKS_DISCOVERY, 20000)
                    ]
                } else {
                    return [
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.BLOCKS_DISCOVERY, 10000)
                    ]
                }
            case CyclicEventsName.TRANSACTION_GENERATION:
                var waitTime = this.getTimeInterval(this.network.settings.minTransactionCreationInterval, this.network.settings.avgTransactionCreationInterval);

                var accountService = this.serviceDispositor.getAccountService(processingNode);
                var sourceAccount = accountService.getRandomManagedAccount();
                var targetAddress = accountService.getRandomNonManagedAddress();
                var maxSpendableAmount = accountService.getSafeAvailableBalance(sourceAccount.wallet.publicKey);

                if (maxSpendableAmount > 0) {
                    var amount = Math.ceil(Math.random() * maxSpendableAmount);

                    return [
                        this.eventFactory.createTransactionCreatingEvent(processingNode, sourceAccount.wallet, targetAddress, amount),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTION_GENERATION, waitTime)
                    ];
                } else {
                    return [
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTION_GENERATION, waitTime)
                    ];
                }

            case CyclicEventsName.MINERS_SELECTION:
                var { currentTimestamp } = this.network.timer;
                var { roundTime, minersPerRound } = this.network.settings;

                var timeQuantum = roundTime / minersPerRound;
                var waitTime = timeQuantum - (currentTimestamp % timeQuantum) + 1000;

                var nextProcessableEvents = [];

                var accountService = this.serviceDispositor.getAccountService(processingNode);
                var managedAddresses = accountService.getManagedAccounts();

                var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);
                processingNode.blockchain.leadingBlocks.forEach(leadingBlock => {
                    managedAddresses.forEach(managedAddress => {
                        if (blockchainService.canAddressConstructNewBlock(leadingBlock, managedAddress.wallet.publicKey.toString(16), currentTimestamp)) {
                            nextProcessableEvents.push(
                                this.eventFactory.createBlockCreatingEvent(processingNode, leadingBlock, managedAddress.wallet.publicKey.toString(16))
                            );
                        }
                    })

                })

                return [
                    ...nextProcessableEvents,
                    this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.MINERS_SELECTION, waitTime)
                ];
        }
    }

    getTimeInterval(minInterval, avgInterval) {
        return minInterval + Math.random() * 2 * (avgInterval - minInterval);
    }

    getPeersDiscoveryTimeInterval(processingNode) {
        return processingNode.networkInterface.getLinksNumber() < this.network.settings.minLinksPerNode ?
            15000 + Math.random() * 10000 :
            300000 + Math.random() * 50000;
    }

}
