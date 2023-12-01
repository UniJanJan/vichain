import { Event } from "./event.js";

export class NodeCreatingEvent extends Event {
    constructor(x, y) {
        super(0); // TODO
        this.x = x;
        this.y = y;
    }

    draw(graphics, settings) {
        // TODO
    }
}
