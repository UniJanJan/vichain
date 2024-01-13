import { BlockCreatingEvent } from "../../model/event/block_creating_event.js";
import { BlockVerifyingEvent } from "../../model/event/block_verifying_event.js";
import { BlockchainInstallingEvent } from "../../model/event/blockchain_installing_event.js";
import { LinkCreatingEvent } from "../../model/event/link_creating_event.js";
import { LinkRemovingEvent } from "../../model/event/link_removing_event.js";
import { MessageReceivingEvent } from "../../model/event/message_receiving_event.js";
import { MessageSendingEvent } from "../../model/event/message_sending_event.js";
import { MessageTransmissionEvent } from "../../model/event/message_transmission_event.js";
import { NodeCreatingEvent } from "../../model/event/node_creating_event.js";
import { RandomNodeCreatingEvent } from "../../model/event/random_node_creating_event.js";
import { TransactionCreatingEvent } from "../../model/event/transaction_creating_event.js";
import { TransactionVerifyingEvent } from "../../model/event/transaction_verifying_event.js";
import { WaitingEvent } from "../../model/event/waiting_event.js";
import { BlockMessage } from "../../model/message/block_message.js";
import { RejectMessage } from "../../model/message/reject_message.js";
import { TrxMessage } from "../../model/message/trx_message.js"
import { VersionMessage } from "../../model/message/version_message.js";

export class EventFactory {

    constructor(settings) {
        this.settings = settings;
    }

    createTransactionCreatingEvent(processingNode, sourceWallet, targetAddress, amount, prioritized = false) {
        var duration = this.settings.eventDurations[TransactionCreatingEvent.name];
        return {
            target: processingNode,
            event: new TransactionCreatingEvent(duration, processingNode, sourceWallet, targetAddress, amount).withPriority(prioritized)
        };
    }

    createTransactionVerifyingEvent(processingNode, transaction, informedNodes) {
        var duration = this.settings.eventDurations[TransactionVerifyingEvent.name];
        return {
            target: processingNode,
            event: new TransactionVerifyingEvent(duration, processingNode, transaction, informedNodes)
        };
    }

    createMessagesSendingEvent(sourceNode, targetNodes, message, prioritized = false) {
        var duration = this.settings.eventDurations[MessageSendingEvent.name];
        return {
            target: sourceNode,
            event: new MessageSendingEvent(duration, sourceNode, targetNodes, message).withPriority(prioritized)
        };
    }

    createMessageSendingEvent(sourceNode, targetNode, message) {
        return this.createMessagesSendingEvent(sourceNode, [targetNode], message);
    }

    createTransactionBroadcastEvent(sourceNode, transaction, informedNodes = []) {
        return this.createMessageBroadcastEvent(sourceNode, new TrxMessage(transaction, [...informedNodes, sourceNode.id]), informedNodes);
    }

    createMessageBroadcastEvent(sourceNode, message, excludedNodes = [], prioritized) {
        var targetNodes = sourceNode.networkInterface.getAllEstablishedLinkedNodes().filter(targetNode => !excludedNodes.includes(targetNode.id));
        return this.createMessagesSendingEvent(sourceNode, targetNodes, message, prioritized);
    }

    createMessageTransmissionEvent(link, sourceNode, targetNode, message) {
        var durationMultiplier = this.settings.eventDurations[MessageTransmissionEvent.name];
        return {
            target: link,
            event: new MessageTransmissionEvent(durationMultiplier, sourceNode, targetNode, message)
        };
    }

    createMessageReceivingEvent(sourceNode, targetNode, message) {
        var duration = this.settings.eventDurations[MessageReceivingEvent.name];
        return {
            target: targetNode,
            event: new MessageReceivingEvent(duration, sourceNode, targetNode, message).withPriority(message.prioritized)
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

    createRandomNodeCreatingEvent(processingNetwork, maxX, maxY) {
        return {
            target: processingNetwork,
            event: new RandomNodeCreatingEvent(maxX, maxY)
        };
    }

    createNodeCreatingEvent(processingNetwork, x, y, prioritized = false) {
        return {
            target: processingNetwork,
            event: new NodeCreatingEvent(x, y).withPriority(prioritized)
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

    createBlockVerifyingEvent(processingNode, leadingBlocks, blocksToVerify, informedNodes) {
        var duration = this.settings.eventDurations[BlockVerifyingEvent.name];
        return {
            target: processingNode,
            event: new BlockVerifyingEvent(duration, processingNode, leadingBlocks, blocksToVerify, informedNodes).withPriority()
        };
    }

    createBlockCreatingEvent(processingNode, leadingBlock, selectedAddress) {
        var duration = this.settings.eventDurations[BlockCreatingEvent.name];
        return {
            target: processingNode,
            event: new BlockCreatingEvent(duration, processingNode, leadingBlock, selectedAddress).withPriority()
        };
    }

    createBlockBroadcastEvent(sourceNode, block, informedNodes = []) {
        return this.createMessageBroadcastEvent(sourceNode, new BlockMessage(block, [...informedNodes, sourceNode.id]), informedNodes, true);
    }

}
