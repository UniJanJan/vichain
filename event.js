const EventStatus = {
    PROCESSABLE: 0,
    PROCESSING: 1,
    PROCESSED: 2
};

class Event {
    constructor(duration) {
        this.duration = duration;
        this.progress = 0;
        this.status = EventStatus.PROCESSING;
    }
}

class VersionMessage {
    constructor(version, block) {
        this.version = version;
        this.block = block; //TODO
        this.timestamp = 0; // TODO
    }
}

class MessageTransmissionEvent extends Event {
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
    }

    update() {
        this.progress += 1;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
            this.nodeTo.dispatchMessage(this);
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