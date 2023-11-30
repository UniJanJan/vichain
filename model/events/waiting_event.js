import { Event, EventStatus } from "./event.js";

export const CyclicEventsName = {
    SENDING_ADDRESS: 'addr',
    PEERS_DISCOVERY: 'peers_discovery'
}

export class WaitingEvent extends Event {
    constructor(name, timeInterval) {
        super(timeInterval);
        this.name = name;
        this.loadSize = 0;
    }

    update(elapsedTime) {
        this.progress += elapsedTime;
        if (this.progress >= this.duration) {
            this.status = EventStatus.PROCESSED;
        }
    }

    draw(graphics) {
        // nothing to draw
    }
}
