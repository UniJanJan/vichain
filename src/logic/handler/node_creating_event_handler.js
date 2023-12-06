import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { Node } from "../../model/entity/node.js";
import { EventHandler } from "./event_handler.js";

export class NodeCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory)
    }

    handle(processingNetwork, processedEvent) {
        var node = new Node(processingNetwork, processedEvent.x, processedEvent.y);
        // node.knownAddresses.add(processingNetwork.walletPool.getAllKnownAddress());
        // var wallet = processingNetwork.walletPool.pickFreeWallet();
        // if (wallet) {
        //     node.knownWallets.push(wallet);
        // }

        node.networkInterface.rememberNodes(processingNetwork.informativeNodes);
        processingNetwork.addNode(node);

        if (!processingNetwork.hasInformativeNode()) {
            processingNetwork.addInformativeNode(node);
        }

        var nextProcessableEvents = [
            this.eventFactory.createWaitingEvent(node, CyclicEventsName.PEERS_DISCOVERY, 1000)
        ];

        if (processingNetwork.settings.isBlockchainInstalled) {
            var newWallet = processingNetwork.walletPool.addRandomWallet();
            node.knownWallets.push(newWallet);

            nextProcessableEvents.push(this.eventFactory.createBlockVerifyingEvent(node, processingNetwork.settings.genesisBlock));
            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTIONS_DISCOVERY, 0));
            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(node, CyclicEventsName.MINERS_SELECTION, 0));
            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(node, CyclicEventsName.TRANSACTION_GENERATION, Math.random() * 10000));
        }

        return nextProcessableEvents;
    }
}
