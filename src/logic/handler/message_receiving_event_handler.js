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
    constructor(network, eventFactory, serviceDispositor) {
        super(network, eventFactory, serviceDispositor);
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
            return [this.eventFactory.createTransactionVerifyingEvent(processingNode, event.message.transaction, event.nodeFrom)];
        } else if (event.message instanceof GetAddrMessage) {
            return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new AddrMessage(processingNode.networkInterface.getAllLinkableNodes()))];
        } else if (event.message instanceof BlockMessage) {
            var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);
            var blockchainHeight = blockchainService.getBlockchainHeight();
            if (blockchainHeight + 1 < event.message.block.blockBody.height) {
                return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new GetBlocksMessage())];
            } else if (blockchainHeight + 1 === event.message.block.blockBody.height) {
                return [this.eventFactory.createBlockVerifyingEvent(processingNode, processingNode.blockchain.leadingBlocks, [event.message.block], event.nodeFrom)];
            } else if (blockchainHeight === event.message.block.blockBody.height) {
                return [this.eventFactory.createBlockVerifyingEvent(processingNode, processingNode.blockchain.leadingBlocks.map(leadingBlock => leadingBlock.previousBlock), [event.message.block], event.nodeFrom)];
            } else {
                return [];
            }
        } else if (event.message instanceof GetTransactionsMessage) {
            var transactionService = this.serviceDispositor.getTransactionService(processingNode);
            transactionService.dropStaleTransactions();
            return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new GetTransactionsResponseMessage(processingNode.transactionPool.transactions))];
        } else if (event.message instanceof GetTransactionsResponseMessage) {
            var transactionService = this.serviceDispositor.getTransactionService(processingNode);
            var putTransactions = transactionService.putUncommittedTransactions(event.message.transactions);
            var accountService = this.serviceDispositor.getAccountService(processingNode);
            putTransactions.forEach(accountService.updateAvailableBalance.bind(accountService));
            return [];
        } else if (event.message instanceof GetBlocksMessage) {
            return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new GetBlocksResponseMessage(processingNode.blockchain.getFirstBlockchain()))];
        } else if (event.message instanceof GetBlocksResponseMessage) {
            var blockchainService = this.serviceDispositor.getBlockchainService(processingNode);

            var blocks = [...event.message.blocks];

            if (blockchainService.getBlockchainHeight() + 1 < blocks.length) {
                return [
                    this.eventFactory.createBlockVerifyingEvent(processingNode, [null], blocks, event.informatorNode)
                ];
            } else {
                return [];
            }
        }
    }

}