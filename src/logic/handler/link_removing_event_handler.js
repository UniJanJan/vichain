import { EventHandler } from "./event_handler.js";

export class LinkRemovingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNetwork, processedEvent, baton) {
        processedEvent.initiatingNode.networkInterface.rejectLinkWith(processedEvent.targetNode);
    }
}