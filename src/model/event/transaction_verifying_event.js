import { Event } from "./event.js";

export class TransactionVerifyingEvent extends Event {
    constructor(duration, processingNode, transaction, informedNodes) {
        super(duration);
        this.processingNode = processingNode;
        this.transaction = transaction;
        this.informedNodes = informedNodes || [];
    }

    draw(graphics, settings) {
        const progressRatio = this.progress / this.duration;
        graphics.beginPath();
        graphics.arc(this.processingNode.x, this.processingNode.y, this.processingNode.radius + 4, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * progressRatio, false);
        graphics.strokeStyle = settings.color;
        graphics.lineWidth = 7;
        graphics.stroke();
    }
}
