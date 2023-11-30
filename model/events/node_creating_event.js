import { Event, EventStatus } from "./event.js";

export class NodeCreatingEvent extends Event {
    constructor(x, y) {
        super(0); // TODO
        this.x = x;
        this.y = y;
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
