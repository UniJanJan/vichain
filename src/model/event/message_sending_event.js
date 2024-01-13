import { Event } from "./event.js";

export class MessageSendingEvent extends Event {
    constructor(duration, nodeFrom, nodesTo, message) {
        super(duration);
        this.nodeFrom = nodeFrom;
        this.nodesTo = nodesTo;
        this.message = message;
    }

    draw(graphics, settings) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.arc(this.nodeFrom.x, this.nodeFrom.y, this.nodeFrom.radius + 4, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.strokeStyle = settings.color;
        graphics.lineWidth = 7;
        graphics.stroke();
    }
}
