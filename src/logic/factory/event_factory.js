import { BlockCreatingEvent } from "../../model/event/block_creating_event.js";
import { BlockVerifyingEvent } from "../../model/event/block_verifying_event.js";
import { BlockchainInstallingEvent } from "../../model/event/blockchain_installing_event.js";
import { LinkCreatingEvent } from "../../model/event/link_creating_event.js";
import { LinkRemovingEvent } from "../../model/event/link_removing_event.js";
import { MessageReceivingEvent } from "../../model/event/message_receiving_event.js";
import { MessageSendingEvent } from "../../model/event/message_sending_event.js";
import { MessageTransmissionEvent } from "../../model/event/message_transmission_event.js";
import { NodeCreatingEvent } from "../../model/event/node_creating_event.js";
import { TransactionCreatingEvent } from "../../model/event/transaction_creating_event.js";
import { TransactionVerifyingEvent } from "../../model/event/transaction_verifying_event.js";
import { WaitingEvent } from "../../model/event/waiting_event.js";
import { BlockMessage } from "../../model/message/block_message.js";
import { RejectMessage } from "../../model/message/reject_message.js";
import { TrxMessage } from "../../model/message/trx_message.js"
import { VersionMessage } from "../../model/message/version_message.js";

export class EventFactory {
    constructor() {
    }

    createTransactionCreatingEvent(processingNode, sourceWallet, targetAddress, amount) {
        // needs validation (but not here?)
        return {
            target: processingNode,
            event: new TransactionCreatingEvent(processingNode, sourceWallet, targetAddress, amount)
        };
    }

    createTransactionVerifyingEvent(processingNode, transaction, informatorNode) {
        return {
            target: processingNode,
            event: new TransactionVerifyingEvent(processingNode, transaction, informatorNode)
        };
    }

    createMessagesSendingEvent(sourceNode, targetNodes, message, prioritized = false) {
        return {
            target: sourceNode,
            event: new MessageSendingEvent(sourceNode, targetNodes, message).withPriority(prioritized)
        };
    }

    createMessageSendingEvent(sourceNode, targetNode, message) {
        return this.createMessagesSendingEvent(sourceNode, [targetNode], message);
    }

    createTransactionBroadcastEvent(sourceNode, transaction, excludedNodes = []) {
        return this.createMessageBroadcastEvent(sourceNode, new TrxMessage(transaction), excludedNodes);
    }

    createMessageBroadcastEvent(sourceNode, message, excludedNodes = [], prioritized) {
        var targetNodes = sourceNode.networkInterface.getAllEstablishedLinkedNodes().filter(targetNode => !excludedNodes.includes(targetNode));
        return this.createMessagesSendingEvent(sourceNode, targetNodes, message, prioritized);
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
            event: new MessageReceivingEvent(sourceNode, targetNode, message).withPriority(message.prioritized)
        };
    }

    createWaitingEvent(processingNode, name, timeInterval, additionalData) {
        return {
            target: processingNode,
            event: new WaitingEvent(name, timeInterval, additionalData)
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

    createBlockchainInstallingEvent(processingNetwork, nodesForInstall) {
        return {
            target: processingNetwork,
            event: new BlockchainInstallingEvent(nodesForInstall)
        };
    }

    createBlockVerifyingEvent(processingNode, leadingBlocks, blocksToVerify, informatorNode) {
        return {
            target: processingNode,
            event: new BlockVerifyingEvent(processingNode, leadingBlocks, blocksToVerify, informatorNode).withPriority()
        };
    }

    createBlockCreatingEvent(processingNode, leadingBlock, selectedAddress) {
        return {
            target: processingNode,
            event: new BlockCreatingEvent(processingNode, leadingBlock, selectedAddress).withPriority()
        };
    }

    createBlockBroadcastEvent(sourceNode, block, excludedNodes = []) {
        return this.createMessageBroadcastEvent(sourceNode, new BlockMessage(block), excludedNodes, true);
    }

}
