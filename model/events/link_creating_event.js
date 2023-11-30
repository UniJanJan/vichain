import { Event, EventStatus } from "./event.js";

export class LinkCreatingEvent extends Event {
    constructor(initiatingNode, targetNode) {
        super(0); // TODO
        this.initiatingNode = initiatingNode;
        this.targetNode = targetNode;
    }

    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics, settings) {
        // TODO
    }
}
