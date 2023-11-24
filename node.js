class Node {
    static nextId = 1;

    static brakingFactor = 0.95;

    constructor(x, y) {
        this.id = Node.nextId++;

        this.eventProcessor = new EventProcessor(1, this.onProcessed.bind(this));

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
    }

    sendMessage(nodeTo, message) {
        if (this.isLinkedWith(nodeTo)) {
            this.eventProcessor.enqueueExecution(new MessageSendingEvent(this, nodeTo, message));
        }
    }

    receiveMessage(nodeFrom, message) {
        if (nodeFrom.isLinkedWith(this)) {
            this.eventProcessor.enqueueExecution(new MessageReceivingEvent(nodeFrom, this, message));
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

    onProcessed(processedEvent) {
        if (processedEvent instanceof MessageSendingEvent) {
            // TODO what if link has been destroyed?
            processedEvent.link.transmitMessageTo(processedEvent.nodeTo, processedEvent.message);
        } else if (processedEvent instanceof MessageReceivingEvent) {
            this.dispatchMessage(processedEvent);
        }
    }

    update() {
        this.updateVelocity();
        this.updatePosition();
        this.eventProcessor.update();
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