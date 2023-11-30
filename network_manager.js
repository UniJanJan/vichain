import { Utils } from "./common.js";
import { EventMaster } from "./logic/event_master.js";
import { EventFactory } from "./logic/factory/event_factory.js";
import { Network } from "./network.js";

export class NetworkManager {
    constructor(network) {
        this.network = network || new Network();
        this.eventFactory = new EventFactory(this.network.settings);
        this.eventMaster = new EventMaster(this.network, this.eventFactory);

        this.selectedNode = null;

        // this.nodePositionsMap = {};
        this.settings = {
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
                'WaitingEvent': {
                    isVisible: null,
                    color: 'rgb(165,42,42)'
                }
            }
        }
    }

    addNode(x, y) {
        this.eventMaster.enqueueExecution(this.eventFactory.createNodeCreatingEvent(this.network, x, y));

    }

    addLink(initiatingNode, targetNode) {
        this.eventMaster.enqueueExecution(this.eventFactory.createLinkCreatingEvent(this.network, initiatingNode, targetNode));
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

    update(tFrame = 0) { // TODO
        var elapsedTime = this.network.timer.update(tFrame);
        this.network.update(elapsedTime);
        this.eventMaster.update(elapsedTime);
    }

    draw(graphics) { //TODO
        this.network.links.forEach(link => link.draw(graphics));
        this.network.nodes.forEach(node => node.draw(graphics, this.settings));
    }
}