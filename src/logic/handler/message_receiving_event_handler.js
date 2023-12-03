import { LinkStatus } from "../../model/entity/link.js";
import { AddrMessage } from "../../model/message/addr_message.js";
import { GetAddrMessage } from "../../model/message/getaddr_message.js";
import { RejectMessage } from "../../model/message/reject_message.js";
import { TrxMessage } from "../../model/message/trx_message.js";
import { VerAckMessage } from "../../model/message/verack_message.js";
import { VersionMessage } from "../../model/message/version_message.js";
import { EventHandler } from "./event_handler.js";

export class MessageReceivingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        // processingNode === processedEvent.nodeTo?
        return this.dispatchMessage(processingNode, processedEvent);
    }

    dispatchMessage(processingNode, event) {
        if (event.message instanceof VersionMessage) {
            processingNode.networkInterface.rememberNode(event.nodeFrom);

            if (processingNode.networkInterface.getAtLeastHalfEstablishedLinkedNodes().length < this.network.settings.maxLinksPerNode) {
                var link = processingNode.networkInterface.getLinkWith(event.nodeFrom);
                var shouldBePrioritized = processingNode.networkInterface.shouldBePrioritized(event.nodeFrom);
                if (link && link.status === LinkStatus.VIRTUAL) {
                    //TODO make prioritized?
                    return [
                        this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new VerAckMessage()),
                        this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new VersionMessage(processingNode.version, shouldBePrioritized))
                    ];
                } else if (link && link.status === LinkStatus.HALF_ESTABLISHED) {
                    link.prioritizationByNode[event.nodeFrom] = event.message.shouldBePrioritized;
                    return [
                        this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new VerAckMessage())
                    ];
                } else if (link && link.status === LinkStatus.ESTABLISHED) {
                    link.prioritizationByNode[event.nodeFrom] = event.message.shouldBePrioritized;
                    return this.eventFactory.createLinksUpdateEvents(this.network, processingNode);
                } else {
                    return [];
                }
            } else {
                return [
                    this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new RejectMessage())
                ];
            }
        } else if (event.message instanceof VerAckMessage) {
            processingNode.networkInterface.confirmLinkWith(event.nodeFrom);
            return [];
        } else if (event.message instanceof RejectMessage) {
            processingNode.networkInterface.rejectLinkWith(event.nodeFrom);
            return [this.eventFactory.createLinkRemovingEvent(this.network, event.nodeFrom, event.nodeTo)];
        } else if (event.message instanceof AddrMessage) {
            // this.networkInterface.rememberNodes.bind(this.networkInterface)(event.message.linkedNodes)
            event.message.linkedNodes.forEach(processingNode.networkInterface.rememberNode.bind(processingNode.networkInterface));
            return this.eventFactory.createLinksUpdateEvents(this.network, processingNode);
        } else if (event.message instanceof TrxMessage) {
            return [this.eventFactory.createTransactionVerifyingEvent(processingNode, event.message.transaction)];
        } else if (event.message instanceof GetAddrMessage) {
            return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new AddrMessage(processingNode.networkInterface.getAllLinkableNodes()))];
        }
    }
}