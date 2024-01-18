import { EventHandler } from "./event_handler.js";

export class RandomNodeCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor)
    }

    handle(processingNetwork, processedEvent, baton) {
        const randomValues = new Uint32Array(2);
        window.crypto.getRandomValues(randomValues);
        var randomX = randomValues[0];
        var randomY = randomValues[1];
        var x = randomX % (processedEvent.maxX - 40) + 20;
        var y = randomY % (processedEvent.maxY - 40) + 20;

        baton.nextProcessableEvents.push(
            this.eventFactory.createNodeCreatingEvent(processingNetwork, x, y, true)
        );
    }

}