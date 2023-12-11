import { Event } from "./event.js";

export class TransactionCreatingEvent extends Event {
    constructor(processingNode, sourceWallet, targetAddress, amount) {
        super(500);
        this.processingNode = processingNode;
        this.sourceWallet = sourceWallet;
        this.targetAddress = targetAddress;
        this.amount = amount;
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
