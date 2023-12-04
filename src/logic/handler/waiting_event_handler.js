import { Utils } from "../../common.js";
import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { AddrMessage } from "../../model/message/addr_message.js";
import { GetAddrMessage } from "../../model/message/getaddr_message.js";
import { EventHandler } from "./event_handler.js";

export class WaitingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
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
            case CyclicEventsName.TRANSACTION_GENERATION:
                var waitTime = this.getTransactionGenerationTimeInterval.bind(this)();
                var sourceWallet = Utils.getRandomElement(processingNode.knownWallets);
                var targetAddress = Utils.getRandomElement(this.network.walletPool.getAllAddresses());
                var amount = 1 + Math.floor(Math.random() * 10);

                return [
                    this.eventFactory.createTransactionCreatingEvent(processingNode, sourceWallet, targetAddress, amount),
                    this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTION_GENERATION, waitTime)
                ];
        }
    }

    getTransactionGenerationTimeInterval() {
        return this.network.settings.minTransactionCreationInterval + Math.random() * 2 * (this.network.settings.avgTransactionCreationInterval - this.network.settings.minTransactionCreationInterval);
    }

    getPeersDiscoveryTimeInterval(processingNode) {
        return processingNode.networkInterface.getLinksNumber() < this.network.settings.minLinksPerNode ?
            15000 + Math.random() * 10000 :
            300000 + Math.random() * 50000;
    }

}
