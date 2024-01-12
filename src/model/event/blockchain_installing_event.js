import { Event } from "./event.js";

/* event creates initial genesis block and assign random wallet in each present node */
export class BlockchainInstallingEvent extends Event {
    constructor(nodes) {
        super(0); // TODO
        this.nodes = nodes;

        this.loadSize = 1;
    }

    draw(graphics, settings) {
        // TODO
    }
}
