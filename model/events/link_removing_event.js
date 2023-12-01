import { Event } from "./event.js";

export class LinkRemovingEvent extends Event {
    constructor(initiatingNode, targetNode) {
        super(0); // TODO
        this.initiatingNode = initiatingNode;
        this.targetNode = targetNode;
    }

    draw(graphics, settings) {
        // TODO
    }
}