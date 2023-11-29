import { Link } from './link.js';
import { VersionMessage } from './model/messages/version_message.js';
import { Timer } from './model/time/timer.js';

export class Network {
    constructor() {
        this.nodes = [];
        this.links = [];
        // this.eventProcessor = new EventProcessor();
        this.informativeNodes = [];

        this.timer = new Timer();

        this.settings = {
            minLinksPerNode: 3,
            maxLinksPerNode: 20
        }
    }

    addNode(node) {
        this.informativeNodes.forEach(informativeNode => node.networkInterface.rememberNode(informativeNode));
        // node.networkInterface.rememberNodes(this.informativeNodes);
        this.nodes.push(node);
    }

    hasInformativeNode(node) {
        return this.informativeNodes.length > 0;
    }

    addInformativeNode(node) {
        this.informativeNodes.push(node);
    }

    addLink(initiatingNode, targetNode) {
        if (initiatingNode.id !== targetNode.id && !initiatingNode.networkInterface.isLinkedWith(targetNode)) {
            var link = new Link(this, initiatingNode, targetNode);
            this.links.push(link);

            // TODO this logic shouldn't be here
            initiatingNode.networkInterface.rememberNode(targetNode);
            var shouldBePrioritized = initiatingNode.networkInterface.shouldBePrioritized(targetNode);
            link.prioritizationByNode[initiatingNode] = shouldBePrioritized;
            initiatingNode.eventManager.sendMessage(targetNode, new VersionMessage(initiatingNode.version));
        }
    }

    getNodesNumber() {
        return this.nodes.length;
    }

}
