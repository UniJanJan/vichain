import { Node } from './node.js';
import { Link } from './link.js';
import { Utils } from './common.js';
import { VersionMessage } from './event.js';
import { Timer } from './timer.js';

export class Network {
    constructor() {
        this.nodes = [];
        this.links = [];
        // this.eventProcessor = new EventProcessor();
        // this.nodePositionsMap = {};
        this.selectedNode = null;
        this.informativeNodes = [];
        
        this.timer = new Timer();

        this.settings = {
            maxLinksPerNode: 3
        }
    }

    addNode(x, y) {
        var node = new Node(x, y).withNetwork(this);
        this.nodes.push(node);

        if (this.informativeNodes.length === 0) {
            this.informativeNodes.push(node);
        } else {
            this.informativeNodes.forEach(informativeNode => this.addLink(informativeNode, node));
        }
    }

    addLink(node1, node2) {
        if (node1.id !== node2.id && !node1.isLinkedWith(node2)) {
            var link = new Link(node1, node2).withTimer(this.timer);
            this.links.push(link);
            node2.sendMessage(node1, new VersionMessage(node2.version));
        }
    }

    getNode(x, y) {
        for (let index = 0; index < this.nodes.length; index++) {
            const node = this.nodes[index];
            const distance = Utils.distance(node.x, node.y, x, y);
            if (distance <= node.radius) {
                return node;
            }
        }
        return null;
    }

    setSelectedNode(node) {
        if (this.selectedNode !== null)
            this.selectedNode.isSelected = false;
        this.selectedNode = node;
        node.isSelected = true;
    }

    update(tFrame = 0) {
        var elapsedTime = this.timer.update(tFrame);
        this.nodes.forEach(node => node.update(elapsedTime));
        this.links.forEach(link => link.update(elapsedTime));
    }

    draw(graphics) {
        this.links.forEach(link => link.draw(graphics));
        this.nodes.forEach(node => node.draw(graphics));
    }
}
