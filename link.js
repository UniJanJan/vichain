import { Utils } from './common.js';
import { EventProcessor } from './event_processor.js';
import { MessageTransmissionEvent } from './event.js';

export const LinkStatus = {
    VIRTUAL: 0,
    HALFESTABLISHED: 1,
    ESTABLISHED: 2
};

const LinkStatusColor = {};
LinkStatusColor[LinkStatus.VIRTUAL] = 'grey';
LinkStatusColor[LinkStatus.HALFESTABLISHED] = 'orange';
LinkStatusColor[LinkStatus.ESTABLISHED] = 'red';

export class Link {
    constructor(node1, node2) {
        this.eventProcessor = new EventProcessor(Infinity, this.onProcessed.bind(this));

        this.node1 = node1;
        this.node2 = node2;

        this.status = LinkStatus.VIRTUAL;
        this.confirmationsByNode = {};
        // this.confirmedByNode1 = false;
        // this.confirmedByNode2 = false;

        this.node1.linkedNodes[node2] = this;
        this.node2.linkedNodes[node1] = this;

        this.calculateProperties();

        // this.drawOrder = 1;
    }

    onProcessed(processedEvent) {
        if (processedEvent instanceof MessageTransmissionEvent) {
            // TODO what if link has been destroyed?
            processedEvent.nodeTo.receiveMessage(processedEvent.nodeFrom, processedEvent.message);
        }
    }

    transmitMessageTo(nodeTo, message) {
        this.eventProcessor.enqueueExecution(new MessageTransmissionEvent(this.getSecondNode(nodeTo), nodeTo, message));
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

    update() {
        this.eventProcessor.update();
    }

    draw(graphics) {
        graphics.beginPath();
        graphics.moveTo(this.node1.x, this.node1.y);
        graphics.lineTo(this.node2.x, this.node2.y);
        graphics.strokeStyle = LinkStatusColor[this.status];
        graphics.lineCap = 'round';
        graphics.lineWidth = this.width;
        graphics.stroke();

        this.eventProcessor.processingEvents.forEach(event => event.draw(graphics));
    }
}