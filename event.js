export const EventStatus = {
    PROCESSABLE: 0,
    PROCESSING: 1,
    PROCESSED: 2
};

export class Event {
    constructor(duration) {
        this.duration = duration;
        this.progress = 0;
        this.status = EventStatus.PROCESSABLE;
        this.loadSize = 1;

        this.enqueuingTimestamp = null;
        this.processingStartTimestamp = null;
        this.processingEndTimestamp = null;
    }
}

export class VersionMessage {
    constructor(version, shouldBePrioritized, block) {
        this.version = version;
        this.shouldBePrioritized = shouldBePrioritized;
        this.block = block; //TODO
        this.timestamp = 0; // TODO
        Object.freeze(this);
    }

    clone() {
        return new VersionMessage(this.version, this.block);
    }
}

export class VerAckMessage {
    constructor() {
        // type of message without payload

        Object.freeze(this);
    }

    clone() {
        return new VerAckMessage();
    }
}

/* message for link closing */
export class RejectMessage {
    constructor() {
        // type of message without payload

        Object.freeze(this);
    }

    clone() {
        return new RejectMessage();
    }
}

export class GetAddrMessage {
    constructor() {
        // type of message without payload

        Object.freeze(this);
    }

    clone() {
        return new GetAddrMessage();
    }
}

export class AddrMessage {
    constructor(linkedNodes) {
        this.linkedNodes = linkedNodes;

        Object.freeze(this);
    }

    clone() {
        return new AddrMessage(this.linkedNodes.slice());
    }
}

export class TrxMessage {
    constructor(transaction) {
        this.transaction = transaction;

        Object.freeze(this);
    }

    clone() {
        return new TrxMessage(this.transaction.clone());
    }
}


export class WaitingEvent extends Event {
    constructor(name, timeInterval) {
        super(timeInterval);
        this.name = name;
        this.loadSize = 0;
    }

    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics) {
        // nothing to draw
    }
}

export class MessageSendingEvent extends Event {
    constructor(nodeFrom, nodesTo, message) {
        super(500); // TODO
        this.nodeFrom = nodeFrom;
        this.nodesTo = nodesTo;
        this.message = message;
    }

    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
            // TODO what if link has been destroyed?
            // var link = this.nodeFrom.getLinkWith(this.nodeTo);
            // if (link === undefined) {
            //     throw new Error('MessageSendingEvent creation: Link between nodes does not exist!');
            // }
            // this.link.transmitMessageTo(this.nodeTo, this.message);
        }
    }

    draw(graphics, settings) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.moveTo(this.nodeFrom.x, this.nodeFrom.y);
        graphics.arc(this.nodeFrom.x, this.nodeFrom.y, this.nodeFrom.radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.fillStyle = settings.color;
        graphics.fill();
    }
}

export class MessageTransmissionEvent extends Event {
    constructor(nodeFrom, nodeTo, message) {
        var link = nodeFrom.networkInterface.getLinkWith(nodeTo);
        super(link.distance * 15); // TODO
        this.link = link;
        this.nodeFrom = nodeFrom;
        this.nodeTo = nodeTo;
        this.message = message;

        this.status = EventStatus.PROCESSABLE;
    }

    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.arc(
            this.nodeFrom.x + progressRatio * (this.nodeTo.x - this.nodeFrom.x),
            this.nodeFrom.y + progressRatio * (this.nodeTo.y - this.nodeFrom.y),
            this.link.width * 0.6, 0, 2 * Math.PI, false);
        graphics.fillStyle = 'black';
        graphics.fill();
    }
}

export class MessageReceivingEvent extends Event {
    constructor(nodeFrom, nodeTo, message) {
        super(500); // TODO
        this.nodeFrom = nodeFrom;
        this.nodeTo = nodeTo;
        this.message = message;
    }

    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics, settings) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.moveTo(this.nodeTo.x, this.nodeTo.y);
        graphics.arc(this.nodeTo.x, this.nodeTo.y, this.nodeTo.radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.fillStyle = settings.color;
        graphics.fill();
    }
}

export class TransactionCreatingEvent extends Event {
    constructor(processingNode, sourceAddress, targetAddress, amount) {
        super(1000);
        this.processingNode = processingNode;
        this.sourceAddress = sourceAddress;
        this.targetAddress = targetAddress;
        this.amount = amount;
    }


    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics, settings) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.moveTo(this.processingNode.x, this.processingNode.y);
        graphics.arc(this.processingNode.x, this.processingNode.y, this.processingNode.radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.fillStyle = settings.color;
        graphics.fill();
    }
}

export class TransactionVerifyingEvent extends Event {
    constructor(processingNode, transaction) {
        super(1000);
        this.processingNode = processingNode;
        this.transaction = transaction;
    }


    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics, settings) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.moveTo(this.processingNode.x, this.processingNode.y);
        graphics.arc(this.processingNode.x, this.processingNode.y, this.processingNode.radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.fillStyle = settings.color;
        graphics.fill();
    }
}