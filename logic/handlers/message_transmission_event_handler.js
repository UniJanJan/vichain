import { EventHandler } from "./event_handler.js";

export class MessageTransmissionEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingLink, processedEvent) {
        // TODO what if link has been destroyed?
        return [
            this.eventFactory.createMessageReceivingEvent(processedEvent.nodeFrom, processedEvent.nodeTo, processedEvent.message)
        ];
    }
}