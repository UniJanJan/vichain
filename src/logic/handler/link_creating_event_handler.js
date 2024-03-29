import { VersionMessage } from "../../model/message/version_message.js";
import { EventHandler } from "./event_handler.js";

export class LinkCreatingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNetwork, processedEvent, baton) {
        processedEvent.initiatingNode.networkInterface.rememberNode(processedEvent.targetNode);
        processingNetwork.addLink(processedEvent.initiatingNode, processedEvent.targetNode);

        baton.nextProcessableEvents.push(
            this.eventFactory.createMessageSendingEvent(processedEvent.initiatingNode, processedEvent.targetNode, new VersionMessage(processedEvent.initiatingNode.version))
        );
    }
}