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
    constructor(version, block) {
        this.version = version;
        this.block = block; //TODO
        this.timestamp = 0; // TODO
    }
}

export class VerAckMessage {
    constructor() {
        // type of message without payload
    }
}

export class MessageSendingEvent extends Event {
    constructor(nodeFrom, nodesTo, message) {
        // super(1000); // TODO
        super(30);
        this.nodeFrom = nodeFrom;
        this.nodesTo = nodesTo;
        this.message = message;
    }

    update(elapsedTime) {
        this.progress += elapsedTime/16;
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

    draw(graphics) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.moveTo(this.nodeFrom.x, this.nodeFrom.y);
        graphics.arc(this.nodeFrom.x, this.nodeFrom.y, this.nodeFrom.radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.fillStyle = 'rgb(0, 0, 128)';
        graphics.fill();
    }
}

export class MessageTransmissionEvent extends Event {
    constructor(nodeFrom, nodeTo, message) {
        const link = nodeFrom.linkedNodes[nodeTo];
        if (link === undefined) {
            throw new Error('MessageTransmissionEvent creation: Link between nodes does not exist!');
        }
        // super(1000); // TODO
        super(link.distance);
        this.link = link;
        this.nodeFrom = nodeFrom;
        this.nodeTo = nodeTo;
        this.message = message;

        this.status = EventStatus.PROCESSABLE;
    }

    update(elapsedTime) {
        this.progress += elapsedTime/16;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
            // this.nodeTo.dispatchMessage(this);
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
        const link = nodeFrom.linkedNodes[nodeTo];
        if (link === undefined) {
            throw new Error('MessageReceivingEvent creation: Link between nodes does not exist!');
        }
        // super(1000); // TODO
        super(30);
        this.link = link;
        this.nodeFrom = nodeFrom;
        this.nodeTo = nodeTo;
        this.message = message;

        this.drawOnTop = true;
    }

    update(elapsedTime) {
        this.progress += elapsedTime/16;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.moveTo(this.nodeTo.x, this.nodeTo.y);
        graphics.arc(this.nodeTo.x, this.nodeTo.y, this.nodeTo.radius, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.fillStyle = 'rgb(0, 0, 64)';
        graphics.fill();
    }
}