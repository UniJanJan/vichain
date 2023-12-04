import { Event } from "./event.js";

export const CyclicEventsName = {
    SENDING_ADDRESS: 'addr',
    PEERS_DISCOVERY: 'peers_discovery',
    TRANSACTION_GENERATION: 'transaction_generation',
    MINERS_SELECTION: 'miners_selection'
}

export class WaitingEvent extends Event {
    constructor(name, timeInterval, additionalData) {
        super(timeInterval);
        this.name = name;
        this.loadSize = 0;
        this.additionalData = additionalData;
    }

    draw(graphics) {
        // nothing to draw
    }
}
