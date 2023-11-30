import { LinkCreatingEvent } from "../../model/events/link_creating_event.js";
import { LinkRemovingEvent } from "../../model/events/link_removing_event.js";
import { MessageReceivingEvent } from "../../model/events/message_receiving_event.js";
import { MessageSendingEvent } from "../../model/events/message_sending_event.js";
import { MessageTransmissionEvent } from "../../model/events/message_transmission_event.js";
import { NodeCreatingEvent } from "../../model/events/node_creating_event.js";
import { TransactionCreatingEvent } from "../../model/events/transaction_creating_event.js";
import { TransactionVerifyingEvent } from "../../model/events/transaction_verifying_event.js";
import { WaitingEvent } from "../../model/events/waiting_event.js";
import { RejectMessage } from "../../model/messages/reject_message.js";
import { TrxMessage } from "../../model/messages/trx_message.js"
import { VersionMessage } from "../../model/messages/version_message.js";

export class EventFactory {
    constructor() {
    }

    createTransactionCreatingEvent(processingNode, sourceAddress, targetAddress, amount) {
        // needs validation (but not here?)
        return {
            target: processingNode,
            event: new TransactionCreatingEvent(processingNode, sourceAddress, targetAddress, amount)
        };
    }

    createTransactionVerifyingEvent(processingNode, transaction) {
        return {
            target: processingNode,
            event: new TransactionVerifyingEvent(processingNode, transaction)
        };
    }

    createMessagesSendingEvent(sourceNode, targetNodes, message) {
        return {
            target: sourceNode,
            event: new MessageSendingEvent(sourceNode, targetNodes, message)
        };
    }

    createMessageSendingEvent(sourceNode, targetNode, message) {
        return this.createMessagesSendingEvent(sourceNode, [targetNode], message);
    }

    createTransactionBroadcastEvent(sourceNode, transaction) {
        return this.createMessageBroadcastEvent(sourceNode, new TrxMessage(transaction));
    }

    createMessageBroadcastEvent(sourceNode, message) {
        return this.createMessagesSendingEvent(sourceNode, sourceNode.networkInterface.getAllEstablishedLinkedNodes(), message); // TODO
    }

    createMessageTransmissionEvent(link, sourceNode, targetNode, message) {
        return {
            target: link,
            event: new MessageTransmissionEvent(sourceNode, targetNode, message)
        };
    }

    createMessageReceivingEvent(sourceNode, targetNode, message) {
        return {
            target: targetNode,
            event: new MessageReceivingEvent(sourceNode, targetNode, message)
        };
    }

    createWaitingEvent(processingNode, name, timeInterval) {
        return {
            target: processingNode,
            event: new WaitingEvent(name, timeInterval)
        };
    }

    createLinkCreatingEvent(processingNetwork, initiatingNode, targetNode) {
        return {
            target: processingNetwork,
            event: new LinkCreatingEvent(initiatingNode, targetNode)
        };
    }

    createLinkRemovingEvent(processingNetwork, initiatingNode, targetNode) {
        return {
            target: processingNetwork,
            event: new LinkRemovingEvent(initiatingNode, targetNode)
        };
    }

    createNodeCreatingEvent(processingNetwork, x, y) {
        return {
            target: processingNetwork,
            event: new NodeCreatingEvent(x, y)
        };
    }

    createLinksUpdateEvents(processingNetwork, processingNode) {
        var classification = this.getLinkableNodesClassification(processingNetwork, processingNode);

        var processableEvents = [];

        classification.toLink.forEach(node => {
            var link = processingNode.networkInterface.getLinkWith(node);
            if (link && !link.prioritizationByNode[processingNode]) {
                processableEvents.push(this.createMessageSendingEvent(processingNode, node, new VersionMessage(processingNode.version, true)));
            } else if (!link) {
                processableEvents.push(this.createLinkCreatingEvent(processingNetwork, processingNode, node));
            }
        });

        classification.toDeprioritize.map(node => {
            processableEvents.push(this.createMessageSendingEvent(processingNode, node, new VersionMessage(processingNode.version, false)));
        });

        classification.toReject.forEach(node => {
            processingNode.networkInterface.rejectLinkWith(node); // TODO not here
            processableEvents.push(this.createMessageSendingEvent(processingNode, node, new RejectMessage()));
        });

        return processableEvents;
    }

    getLinkableNodesClassification(processingNetwork, node) {
        var classification = {
            toLink: [],
            toDeprioritize: [],
            toReject: []
        }

        node.networkInterface.getLinkableNodesSortedByDistance().forEach((linkableNode, index) => {
            if (index < processingNetwork.settings.minLinksPerNode) {
                classification.toLink.push(linkableNode);
            } else {
                var link = node.networkInterface.getLinkWith(linkableNode);
                if (link && !link.prioritizationByNode[linkableNode]) {
                    classification.toReject.push(linkableNode);
                } else if (link) {
                    classification.toDeprioritize.push(linkableNode);
                }
            }
        });

        return classification;
    }
}