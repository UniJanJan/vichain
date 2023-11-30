import { LinkStatus } from "../../link.js";
import { RejectMessage } from "../../model/messages/reject_message.js";
import { VerAckMessage } from "../../model/messages/verack_message.js";
import { VersionMessage } from "../../model/messages/version_message.js";
import { EventHandler } from "./event_handler.js";

export class MessageSendingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        // TODO what if link has been destroyed?
        var message = Object.isFrozen(processedEvent.message) ? processedEvent.message : processedEvent.message.clone();
        return processedEvent.nodesTo.map(targetNode => {
            var link = processingNode.networkInterface.getLinkWith(targetNode);
            if (link && this.canLinkTransmitMessage(link, message)) {
                return this.eventFactory.createMessageTransmissionEvent(link, processingNode, targetNode, message);
            } else {
                return null;
            }
        }).filter(processableEvents => processableEvents != null);
    }

    canLinkTransmitMessage(link, message) {
        return link.status === LinkStatus.ESTABLISHED ||
            message instanceof VersionMessage ||
            message instanceof VerAckMessage ||
            message instanceof RejectMessage;
    }

}