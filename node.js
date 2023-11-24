class Node {
    static nextId = 1;

    static brakingFactor = 0.95;

    constructor(x, y, eventProcessor) {
        this.id = Node.nextId++;

        this.eventProcessor = eventProcessor;
        this.pendingEvents = [];
        this.currentProcessedEvent = null;

        this.linkedNodes = {};

        this.version = 1;

        this.x = x;
        this.y = y;

        this.velocityX = 0;
        this.velocityY = 0;

        this.radius = 20;
        this.isSelected = false;

        this.targetX = null;
        this.targetY = null;

        // this.drawOrder = 2;
    }

    sendMessage(nodeTo, message) {
        this.eventProcessor.sendMessage(this, nodeTo, message);
    }

    // orderMessageSending(nodeTo, message) {
    //     if (this.isLinkedWith(nodeTo)) {
    //         this.pendingEvents.push(new MessageSendingEvent(this, nodeTo, message));
    //     }
    // }

    dispatchMessage(event) {
        // console.log(`[${this}]: Received message: ${event.message}`);
        if (event.message instanceof VersionMessage) {
            // console.log("Received version message: " + event.message);
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

            // if (event.link.status === LinkStatus.VIRTUAL) {
            // event.link.status = LinkStatus.HALFESTABLISHED
            // this.sendMessage(event.nodeFrom, new VerAckMessage());
            // } else if (event.link.status == LinkStatus.HALFESTABLISHED) {
            // event.link.status = LinkStatus.ESTABLISHED;
            // }
        }
    }

    isLinkedWith(node) {
        return this.linkedNodes.hasOwnProperty(node);
    }

    getLinkWith(node) {
        return this.linkedNodes[node];
    }

    // linkWith(node) {
    //     if (!this.isLinkedWith(node)) {
    //         this.links.push(new Link(this, node1, node2));
    //     }
    // }

    updateVelocity() {
        if (this.targetX !== null && this.targetY !== null) {
            this.velocityX = (this.targetX - this.x) / 10;
            this.velocityY = (this.targetY - this.y) / 10;
        } else {
            this.velocityX *= Node.brakingFactor;
            this.velocityY *= Node.brakingFactor;
        }
    }

    updatePosition() {
        this.x += this.velocityX;
        this.y += this.velocityY;

        if (this.velocityX !== 0 || this.velocityY !== 0) {
            Object.values(this.linkedNodes).forEach(link => link.calculateProperties());
        }
    }

    update() {
        this.updateVelocity();
        this.updatePosition();

        if (this.currentProcessedEvent === null && this.pendingEvents.length > 0) {
            this.currentProcessedEvent = this.pendingEvents.splice(0, 1)[0];
            this.eventProcessor.startExecution(this.currentProcessedEvent);
        } else if (this.currentProcessedEvent !== null && this.currentProcessedEvent.status === EventStatus.PROCESSED) {
            if (this.pendingEvents.length > 0) {
                this.currentProcessedEvent = this.pendingEvents.splice(0, 1)[0];
                this.eventProcessor.startExecution(this.currentProcessedEvent);
            } else {
                this.currentProcessedEvent = null;
            }
        }
    }

    draw(graphics) {
        graphics.beginPath();
        graphics.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        graphics.fillStyle = this.isSelected ? 'yellow' : 'blue';
        graphics.fill();
        graphics.strokeStyle = 'black';
        graphics.lineWidth = 3;
        graphics.stroke();
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