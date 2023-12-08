import { LinkStatus } from "../../model/entity/link.js";
import { AddrMessage } from "../../model/message/addr_message.js";
import { BlockMessage } from "../../model/message/block_message.js";
import { GetBlocksMessage } from "../../model/message/get_blocks_message.js";
import { GetBlocksResponseMessage } from "../../model/message/get_blocks_response_message.js";
import { GetTransactionsMessage } from "../../model/message/get_transactions_message.js";
import { GetTransactionsResponseMessage } from "../../model/message/get_transactions_response_message.js";
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
        } else if (event.message instanceof BlockMessage) {
            return [this.eventFactory.createBlockVerifyingEvent(processingNode, event.message.block)];
        } else if (event.message instanceof GetTransactionsMessage) {
            return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new GetTransactionsResponseMessage(processingNode.transactionPool.transactions))];
        } else if (event.message instanceof GetTransactionsResponseMessage) {
            event.message.transactions.forEach(transaction => {
                if (!processingNode.transactionPool.contains(transaction)) {
                    processingNode.transactionPool.put(transaction);
                }
            })
            return [];
        } else if (event.message instanceof GetBlocksMessage) {
            return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new GetBlocksResponseMessage(processingNode.blockchain.leadingBlocks))];
        } else if (event.message instanceof GetBlocksResponseMessage) {
            // TODO
            if (processingNode.blockchain.leadingBlocks.leadingBlocks === 1 && processingNode.blockchain.leadingBlocks[0].block.blockBody.height === 0) {
                processingNode.blockchain.leadingBlocks = processingNode.blockchain.leadingBlocks.flatMap(currentlyLeadingBlock => {
                    return event.message.leadingBlocks.flatMap(potentialyNewLeadingBlock => {
                        if (currentlyLeadingBlock.block.blockBody.height > potentialyNewLeadingBlock.block.blockBody.height) {
                            return [currentlyLeadingBlock];
                        }

                        var currentBlock = currentlyLeadingBlock;
                        while (currentlyLeadingBlock.block.blockBody.height < currentBlock.block.blockBody.height) {
                            currentBlock = currentBlock.previousBlock;
                        }

                        return currentBlock.block === currentlyLeadingBlock.block ? [potentialyNewLeadingBlock] : [];
                    });
                })
                // .map(leadingBlock => clone); //TODO
            }
            return [];
        }
    }
}