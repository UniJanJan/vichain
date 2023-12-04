import { Utils } from "./common.js";
import { EventManager } from "./logic/event_manager.js";
import { EventFactory } from "./logic/factory/event_factory.js";
import { Network } from "./model/entity/network.js";

export class NetworkManager {
    constructor(network) {
        this.network = network || new Network();
        this.eventFactory = new EventFactory(this.network.settings);
        this.eventManager = new EventManager(this.network, this.eventFactory);
        // this.canvas = canvas;

        this.selectedNode = null;

        // this.nodePositionsMap = {};
        this.settings = {
            isRunning: true,
            events: {
                'MessageSendingEvent': {
                    isVisible: true,
                    color: 'rgb(0, 0, 128)'
                },
                'MessageReceivingEvent': {
                    isVisible: true,
                    color: 'rgb(0, 0, 64)'
                },
                'TransactionCreatingEvent': {
                    isVisible: true,
                    color: 'rgb(212,175,55)'
                },
                'TransactionVerifyingEvent': {
                    isVisible: true,
                    color: 'rgb(192,192,192)'
                },
                'BlockVerifyingEvent': {
                    isVisible: true,
                    color: 'rgb(165,165,78)'
                },
                'WaitingEvent': {
                    isVisible: null,
                    color: 'rgb(165,42,42)'
                }
            }
        }
    }

    addNode(x, y) {
        this.eventManager.enqueueExecution(this.eventFactory.createNodeCreatingEvent(this.network, x, y));
    }

    addLink(initiatingNode, targetNode) {
        this.eventManager.enqueueExecution(this.eventFactory.createLinkCreatingEvent(this.network, initiatingNode, targetNode));
    }

    getNode(x, y) {
        for (let index = 0; index < this.network.getNodesNumber(); index++) {
            const node = this.network.nodes[index]; // TODO
            const distance = Utils.distance(node.x, node.y, x, y);
            if (distance <= node.radius) {
                return node;
            }
        }
        return null;
    }

    setSelectedNode(node) { //TODO
        if (this.selectedNode !== null)
            this.selectedNode.isSelected = false;
        this.selectedNode = node;
        node.isSelected = true;
    }

    unselectNode() {
        if (this.selectedNode !== null)
            this.selectedNode.isSelected = false;
        this.selectedNode = null;
    }

    installBlockchain() {
        this.eventManager.enqueueExecution(this.eventFactory.createBlockchainInstallingEvent(this.network, this.network.nodes));
    }

    update(tFrame = 0) { // TODO maybe
        var elapsedTime = this.network.timer.update(tFrame, this.settings.isRunning);
        if (this.settings.isRunning) {
            this.network.update(elapsedTime);
            this.eventManager.update(elapsedTime);
        }
    }

    draw(graphics) { //TODO
        this.network.links.forEach(link => link.draw(graphics));
        this.network.nodes.forEach(node => node.draw(graphics, this.settings));
    }
}