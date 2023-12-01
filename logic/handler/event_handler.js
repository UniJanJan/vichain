export class EventHandler {
    constructor(network, eventFactory) {
        this.network = network;
        this.eventFactory = eventFactory;
    }

    /* handle processed event and returns map of next events to process*/
    handle(processingEntity, processedEvent) {
        throw new Error(`[${processingEntity}]: Handling ${processedEvent} not implemented!`);
    }
}