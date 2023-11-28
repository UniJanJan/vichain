import { Utils } from "./common.js";
import { Network } from "./network.js";
import { Node } from "./node.js";

export class NetworkManager {
    constructor(network) {
        this.network = network || new Network();
        this.selectedNode = null;

        // this.nodePositionsMap = {};
    }

    addNode(x, y) {
        var node = new Node(this.network, x, y);
        this.network.addNode(node);

        if (!this.network.hasInformativeNode()) {
            this.network.addInformativeNode(node);
        } else {
            this.network.informativeNodes.forEach(informativeNode => this.addLink(node, informativeNode));
        }
    }

    addLink(node1, node2) {
        this.network.addLink(node1, node2);
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
        this.network.nodes.forEach(node => node.update(elapsedTime));
        this.network.links.forEach(link => link.update(elapsedTime));
    }

    draw(graphics) { //TODO
        this.network.links.forEach(link => link.draw(graphics));
        this.network.nodes.forEach(node => node.draw(graphics));
    }
}