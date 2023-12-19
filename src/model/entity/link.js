import { Utils } from '../../common/common.js';
import { EventPool } from '../event/event_pool.js';

export const LinkStatus = {
    VIRTUAL: 0,
    HALF_ESTABLISHED: 1,
    ESTABLISHED: 2
};

const LinkStatusColor = {};
LinkStatusColor[LinkStatus.VIRTUAL] = 'grey';
LinkStatusColor[LinkStatus.HALF_ESTABLISHED] = 'orange';
LinkStatusColor[LinkStatus.ESTABLISHED] = 'red';

export class Link {
    constructor(network, node1, node2) {
        this.network = network;
        this.timer = network.timer;

        this.node1 = node1;
        this.node2 = node2;

        this.events = new EventPool();

        this.status = LinkStatus.VIRTUAL;
        this.confirmationsByNode = {};
        this.confirmationsByNode[this.node1] = false;
        this.confirmationsByNode[this.node2] = false;
        this.prioritizationByNode = {};
        this.prioritizationByNode[this.node1] = false;
        this.prioritizationByNode[this.node2] = false;

        this.node1.networkInterface.linkedNodes[node2] = this;
        this.node2.networkInterface.linkedNodes[node1] = this;

        this.calculateProperties();
    }

    confirm(node) {
        this.confirmationsByNode[node] = true;
        this.updateLinkStatus();
    }

    reject(node) {
        this.confirmationsByNode[node] = false;
        this.prioritizationByNode[node] = false; // TODO always?
        this.updateLinkStatus();
    }

    updateLinkStatus() {
        if (this.confirmationsByNode[this.node1] && this.confirmationsByNode[this.node2]) {
            this.status = LinkStatus.ESTABLISHED;
        } else if (this.confirmationsByNode[this.node1] || this.confirmationsByNode[this.node2]) {
            this.status = LinkStatus.HALF_ESTABLISHED;
        } else {
            this.status = LinkStatus.VIRTUAL;
        }
    }

    getSecondNode(firstNode) {
        if (firstNode.id === this.node1.id) {
            return this.node2;
        } else if (firstNode.id === this.node2.id) {
            return this.node1;
        } else {
            throw new Error('getSecondNode: Given node is not part of the link!');
        }
    }

    calculateDistance() {
        this.distance = Utils.distance(this.node1.x, this.node1.y, this.node2.x, this.node2.y);
    }

    calculateWidth() {
        this.width = Utils.linkWidth(this.distance, Math.min(this.node1.radius, this.node2.radius));
    }

    calculateProperties() {
        this.calculateDistance();
        this.calculateWidth();
    }

    update(elapsedTime) {
        // nothing to do
    }

    draw(graphics) {
        graphics.beginPath();
        graphics.moveTo(this.node1.x, this.node1.y);
        graphics.lineTo(this.node2.x, this.node2.y);
        graphics.strokeStyle = LinkStatusColor[this.status];
        graphics.lineCap = 'round';
        graphics.lineWidth = this.width;
        graphics.stroke();

        this.events.processingEvents.forEach(event => event.draw(graphics, this));
    }
}