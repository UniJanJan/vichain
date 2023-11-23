class Node {
    static nextId = 1;

    static brakingFactor = 0.95;

    constructor(x, y, eventProcessor) {
        this.id = Node.nextId++;

        this.eventProcessor = eventProcessor;

        this.linkedNodes = {};

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
        this.eventProcessor.sendMessage(this, nodeTo, message);
    }

    dispatchMessage(event) {
        console.log(`[${this}]: Received message: ${event.message}`);
        if (event.message instanceof VersionMessage) {
            console.log("Received version message: " + event.message);
            this.sendMessage(event.nodeFrom, new VersionMessage('1.0'));
        }
    }

    isLinkedWith(node) {
        return this.linkedNodes.hasOwnProperty(node);
    }

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