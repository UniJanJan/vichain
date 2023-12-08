import { Event } from "./event.js";

export class MessageReceivingEvent extends Event {
    constructor(nodeFrom, nodeTo, message) {
        super(250); // TODO
        this.nodeFrom = nodeFrom;
        this.nodeTo = nodeTo;
        this.message = message;
    }

    draw(graphics, settings) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.arc(this.nodeTo.x, this.nodeTo.y, this.nodeTo.radius + 4, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.strokeStyle = settings.color;
        graphics.lineWidth = 7;
        graphics.stroke();
    }
}
