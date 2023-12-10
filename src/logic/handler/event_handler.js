export class EventHandler {
    constructor(network, eventFactory, serviceDispositor) {
        this.network = network;
        this.eventFactory = eventFactory;
        this.serviceDispositor = serviceDispositor;
    }

    /* handle processed event and returns map of next events to process*/
    handle(processingEntity, processedEvent) {
        throw new Error(`[${processingEntity}]: Handling ${processedEvent} not implemented!`);
    }
}