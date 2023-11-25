import { LinkStatus } from './link.js';
import { EventProcessor } from './event_processor.js';
import { MessageSendingEvent, MessageReceivingEvent, VersionMessage, VerAckMessage, WaitingEvent, AddrMessage } from './event.js';
import { Utils } from './common.js';

const CyclicEventsName = {
    SENDING_ADDRESS: 'addr'
}

export class Node {
    static nextId = 1;

    static brakingFactor = 0.95;

    constructor(x, y) {
        this.id = Node.nextId++;

        this.eventProcessor = new EventProcessor(1, this.onProcessed.bind(this));

        this.linkedNodes = {};
        // this.linkedNodes = new Map();

        this.version = 1;

        this.x = x;
        this.y = y;

        this.velocityX = 0;
        this.velocityY = 0;

        this.radius = 20;
        this.isSelected = false;

        this.targetX = null;
        this.targetY = null;

        this.timer = null;
    }

    withNetwork(network) {
        this.network = network;
        this.timer = network.timer;
        this.eventProcessor.timer = this.timer;
        this.wait(CyclicEventsName.SENDING_ADDRESS, 60000);
        return this;
    }

    wait(name, timeInterval) {
        this.eventProcessor.enqueueExecution(new WaitingEvent(name, timeInterval));
    }

    sendMessages(nodesTo, message) {
        this.eventProcessor.enqueueExecution(new MessageSendingEvent(this, nodesTo, message));
    }

    sendMessage(nodeTo, message) {
        this.sendMessages([nodeTo], message);
    }

    broadcastMessage(message) {
        this.sendMessages(this.getAllEstablishedLinkedNodes(), message);
    }

    receiveMessage(nodeFrom, message) {
        if (nodeFrom.isLinkedWith(this)) {
            this.eventProcessor.enqueueExecution(new MessageReceivingEvent(nodeFrom, this, message));
        }
    }

    onProcessed(processedEvent) {
        if (processedEvent instanceof MessageSendingEvent) {
            // TODO what if link has been destroyed?
            processedEvent.nodesTo.forEach(nodeTo => {
                var link = this.getLinkWith(nodeTo);
                if (link) {
                    link.transmitMessageTo(nodeTo, processedEvent.message.clone());
                }
            });

        } else if (processedEvent instanceof MessageReceivingEvent) {
            this.dispatchMessage(processedEvent);
        } else if (processedEvent instanceof WaitingEvent) {
            switch (processedEvent.name) {
                case CyclicEventsName.SENDING_ADDRESS:
                    this.broadcastMessage(new AddrMessage(this.getAllEstablishedLinkedNodes()));
                    this.wait(CyclicEventsName.SENDING_ADDRESS, 60000);
                    break;
            }
        }
    }

    dispatchMessage(event) {
        if (event.message instanceof VersionMessage) {
            if (event.link.status === LinkStatus.VIRTUAL) {
                //TODO make prioritized
                this.sendMessage(event.nodeFrom, new VerAckMessage());
                this.sendMessage(event.nodeFrom, new VersionMessage(this.version));
            } else if (event.link.status === LinkStatus.HALFESTABLISHED) {
                this.sendMessage(event.nodeFrom, new VerAckMessage());
            }
        } else if (event.message instanceof VerAckMessage) {
            event.link.confirmationsByNode[event.nodeTo] = true;

            if (event.link.confirmationsByNode[event.nodeTo] && event.link.confirmationsByNode[event.nodeFrom]) {
                event.link.status = LinkStatus.ESTABLISHED;
            } else if (event.link.confirmationsByNode[event.nodeTo] || event.link.confirmationsByNode[event.nodeFrom]) {
                event.link.status = LinkStatus.HALFESTABLISHED;
            } else {
                event.link.status = LinkStatus.VIRTUAL;
            }
        } else if (event.message instanceof AddrMessage) {
            var linkableNodes = event.message.linkedNodes.map(nodeTo => [nodeTo, Utils.distance(this.x, this.y, nodeTo.x, nodeTo.y)]);
            linkableNodes.sort((node1, node2) => node1[1] - node2[1]);
            linkableNodes.slice(0, 3).map(node => node[0]).forEach(this.linkWith.bind(this));
        }
    }

    isLinkedWith(node) {
        return this.linkedNodes.hasOwnProperty(node);
    }

    getLinkWith(node) {
        return this.linkedNodes[node];
    }

    linkWith(node) {
        this.network.addLink(this, node);
    }

    getAllEstablishedLinkedNodes() {
        return Object.values(this.linkedNodes)
            .filter(link => link.status === LinkStatus.ESTABLISHED)
            .map(link => link.getSecondNode(this));
    }

    updateVelocity(elapsedTime) {
        if (this.targetX !== null && this.targetY !== null) {
            this.velocityX = (this.targetX - this.x) / 10;
            this.velocityY = (this.targetY - this.y) / 10;
        } else {
            this.velocityX *= Node.brakingFactor;
            this.velocityY *= Node.brakingFactor;
        }
    }

    updatePosition(elapsedTime) {
        this.x += this.velocityX * elapsedTime / 16;
        this.y += this.velocityY * elapsedTime / 16;

        if (this.velocityX !== 0 || this.velocityY !== 0) {
            Object.values(this.linkedNodes).forEach(link => link.calculateProperties());
        }
    }

    update(elapsedTime) {
        this.updateVelocity(elapsedTime);
        this.updatePosition(elapsedTime);
        this.eventProcessor.update(elapsedTime);
    }

    draw(graphics) {
        graphics.beginPath();
        graphics.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        graphics.fillStyle = this.isSelected ? 'yellow' : 'blue';
        graphics.fill();
        graphics.strokeStyle = 'black';
        graphics.lineWidth = 3;
        graphics.stroke();

        this.eventProcessor.processingEvents.forEach(event => event.draw(graphics));
    }

    updateTargetPoint(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    abandonTargetPoint() {
        this.targetX = null;
        this.targetY = null;
    }

    toString() {
        return `Node-${this.id}`
    }
}