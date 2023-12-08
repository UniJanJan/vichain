import { Event } from "./event.js";

export class BlockCreatingEvent extends Event {
    constructor(processingNode, leadingBlock, selectedAddress) {
        super(500);
        this.processingNode = processingNode;
        this.leadingBlock = leadingBlock;
        this.selectedAddress = selectedAddress;
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