import { Event, EventStatus } from "./event.js";

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
