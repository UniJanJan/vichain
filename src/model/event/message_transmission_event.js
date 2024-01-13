import { Event } from "./event.js";

export class MessageTransmissionEvent extends Event {
    constructor(durationMultiplier, nodeFrom, nodeTo, message) {
        var link = nodeFrom.networkInterface.getLinkWith(nodeTo);
        super(link.distance * durationMultiplier);
        this.link = link;
        this.nodeFrom = nodeFrom;
        this.nodeTo = nodeTo;
        this.message = message;
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
