import { Event, EventStatus } from "./event.js";

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