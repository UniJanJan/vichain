import { LinkStatus } from "../../model/entity/link.js";
import { RejectMessage } from "../../model/message/reject_message.js";
import { VerAckMessage } from "../../model/message/verack_message.js";
import { VersionMessage } from "../../model/message/version_message.js";
import { EventHandler } from "./event_handler.js";

export class MessageSendingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent, baton) {
        // TODO what if link has been destroyed?
        var message = Object.isFrozen(processedEvent.message) ? processedEvent.message : processedEvent.message.clone();
        baton.nextProcessableEvents.push(...processedEvent.nodesTo.map(targetNode => {
            var link = processingNode.networkInterface.getLinkWith(targetNode);
            if (link && this.canLinkTransmitMessage(link, message)) {
                return this.eventFactory.createMessageTransmissionEvent(link, processingNode, targetNode, message);
            } else {
                return null;
            }
        }).filter(processableEvents => processableEvents != null));
    }

    canLinkTransmitMessage(link, message) {
        return link.status === LinkStatus.ESTABLISHED ||
            message instanceof VersionMessage ||
            message instanceof VerAckMessage ||
            message instanceof RejectMessage;
    }

}