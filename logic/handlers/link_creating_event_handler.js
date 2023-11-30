import { VersionMessage } from "../../model/messages/version_message.js";
import { EventHandler } from "./event_handler.js";

export class LinkCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNetwork, processedEvent) {
        processedEvent.initiatingNode.networkInterface.rememberNode(processedEvent.targetNode);
        processingNetwork.addLink(processedEvent.initiatingNode, processedEvent.targetNode);

        return [
            this.eventFactory.createMessageSendingEvent(processedEvent.initiatingNode, processedEvent.targetNode, new VersionMessage(processedEvent.initiatingNode.version))
        ];
    }
}