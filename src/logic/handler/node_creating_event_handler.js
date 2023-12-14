import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { Node } from "../../model/entity/node.js";
import { EventHandler } from "./event_handler.js";

export class NodeCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor)
    }

    handle(processingNetwork, processedEvent) {
        var node = new Node(processingNetwork, processedEvent.x, processedEvent.y);

        node.networkInterface.rememberNodes(processingNetwork.informativeNodes);
        processingNetwork.addNode(node);

        if (!processingNetwork.hasInformativeNode()) {
            processingNetwork.addInformativeNode(node);
        }

        var nextProcessableEvents = [
            this.eventFactory.createWaitingEvent(node, CyclicEventsName.PEERS_DISCOVERY, 1000)
        ];

        if (processingNetwork.settings.isBlockchainInstalled) {
            var accountService = this.serviceDispositor.getAccountService(node);
            accountService.createAccount();

            var currentTimestamp = this.network.timer.currentTimestamp;
            var { roundTime } = this.network.settings;
            var timeToNextRound = roundTime - (currentTimestamp % roundTime) + 1000;

            nextProcessableEvents.push(this.eventFactory.createBlockVerifyingEvent(node, [null], [processingNetwork.settings.genesisBlock], this.network.nodes));
            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTIONS_DISCOVERY, 0));
            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(node, CyclicEventsName.MINERS_SELECTION, timeToNextRound));
            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTION_GENERATION, Math.random() * 10000));
        }

        return nextProcessableEvents;
    }
}
