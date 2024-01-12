import { Event } from "./event.js";

export class RandomNodeCreatingEvent extends Event {
    constructor(maxX, maxY) {
        super(10); // TODO
        this.maxX = maxX; 
        this.maxY = maxY;

        this.loadSize = 1;
    }

    draw(graphics, settings) {

    }
}