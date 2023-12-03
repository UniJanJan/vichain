import { Event } from "./event.js";

export class TransactionCreatingEvent extends Event {
    constructor(processingNode, sourceWallet, targetAddress, amount) {
        super(1000);
        this.processingNode = processingNode;
        this.sourceWallet = sourceWallet;
        this.targetAddress = targetAddress;
        this.amount = amount;
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
