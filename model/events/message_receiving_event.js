import { Event, EventStatus } from "./event.js";

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
