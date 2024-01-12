import { Event } from "./event.js";

export class LinkCreatingEvent extends Event {
    constructor(initiatingNode, targetNode) {
        super(0); // TODO
        this.initiatingNode = initiatingNode;
        this.targetNode = targetNode;

        this.loadSize = 0;
    }

    draw(graphics, settings) {
        // TODO
    }
}
