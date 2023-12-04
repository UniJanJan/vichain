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

        return [
            this.eventFactory.createWaitingEvent(node, CyclicEventsName.PEERS_DISCOVERY, 1000)
        ];
    }
}
