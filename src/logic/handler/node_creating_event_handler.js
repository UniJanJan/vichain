import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { Node } from "../../model/entity/node.js";
import { EventHandler } from "./event_handler.js";

export class NodeCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor)
    }

    handle(processingNetwork, processedEvent, baton) {
        var node = new Node(processingNetwork, processedEvent.x, processedEvent.y, processingNetwork.settings);

        node.networkInterface.rememberNodes(processingNetwork.informativeNodes);
        processingNetwork.addNode(node);

        if (processingNetwork.nodes.length % processingNetwork.settings.informativeNodesAppointingFrequency === 1) {
            processingNetwork.addInformativeNode(node);
        }

        baton.nextProcessableEvents.push(
            this.eventFactory.createWaitingEvent(node, CyclicEventsName.PEERS_DISCOVERY, 1000)
        );

        var accountService = this.serviceDispositor.getAccountService(node);
        accountService.createAccount();

        if (processingNetwork.settings.isBlockchainInstalled) {
            var currentTimestamp = this.network.timer.currentTimestamp;
            var { roundTime } = this.network.settings;
            var timeToNextRound = roundTime - (currentTimestamp % roundTime) + 1000;

            baton.nextProcessableEvents.push(
                this.eventFactory.createBlockVerifyingEvent(node, [null], [processingNetwork.settings.genesisBlock], this.network.nodes.map(node => node.id)),
                this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTIONS_DISCOVERY, 0),
                this.eventFactory.createWaitingEvent(node, CyclicEventsName.MINERS_SELECTION, timeToNextRound),
                this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTION_GENERATION, Math.random() * 10000)
            );
        }
    }
}
