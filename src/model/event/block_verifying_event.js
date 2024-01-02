import { Event } from "./event.js";

export class BlockVerifyingEvent extends Event {
    constructor(processingNode, leadingBlocks, blocksToVerify, informedNodes) {
        super(1000);
        this.processingNode = processingNode;
        this.leadingBlocks = leadingBlocks;
        this.blocksToVerify = blocksToVerify;
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