import { Event } from "./event.js";

export class BlockVerifyingEvent extends Event {
    constructor(processingNode, block, informatorNode) {
        super(1000);
        this.processingNode = processingNode;
        this.block = block;
        this.informatorNode = informatorNode;
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