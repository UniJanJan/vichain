import { RSA } from "../../common/rsa.js";
import { BlockWrapper } from "../../model/blockchain/blockchain.js";
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
            if (blockchainService.getBlockchainHeight() + 1 < event.message.block.blockBody.height) {
                return [this.eventFactory.createMessageSendingEvent(processingNode, event.nodeFrom, new GetBlocksMessage())];
            } else {
                return [this.eventFactory.createBlockVerifyingEvent(processingNode, event.message.block, event.nodeFrom)];
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

            var blocks = event.message.blocks;

            if (blockchainService.getBlockchainHeight() >= blocks.length || !blocks[0].equals(this.network.settings.genesisBlock)) {
                return [];
            }

            var burnAddress = this.network.walletPool.getBurnAddress();
            var leadingBlock = new BlockWrapper(blocks[0], null, burnAddress);
            var miners = [];

            for (var i = 1; i < blocks.length; i++) {
                if (Math.floor(blocks[i - 1].blockBody.creationTimestamp / this.network.settings.roundTime) <
                    Math.floor(blocks[i].blockBody.creationTimestamp / this.network.settings.roundTime)) {

                    miners = blockchainService.getMiners(leadingBlock);
                }

                if (this.isBlockValid(blocks[i - 1], blocks[i], miners)) {
                    leadingBlock = new BlockWrapper(blocks[i], leadingBlock, burnAddress);
                } else {
                    return [];
                }
            }

            processingNode.blockchain.leadingBlocks = [leadingBlock];

            return [];
        }
    }

    isBlockValid(previousBlock, block, miners) {
        return previousBlock.isPreviousFor(block)
            && previousBlock.blockBody.height + 1 === block.blockBody.height
            && previousBlock.blockBody.creationTimestamp < block.blockBody.creationTimestamp
            && CryptoJS.SHA256(JSON.stringify(block.blockBody)).toString() === block.blockHash.toString()
            && this.areTransactionsValid(block.blockBody.transactions, block.blockBody.creationTimestamp, miners);
    }

    areTransactionsValid(transactions, blockCreationTimestamp, miners) {
        var awardTransactions = transactions.filter(transaction => transaction.transactionBody.sourceAddress === null)
        if (awardTransactions.length !== 1
            || awardTransactions[0].transactionBody.amount !== this.network.settings.miningAward) {
            return false;
        }


        while (miners.length > 0 && awardTransactions[0].transactionBody.targetAddress.toString(16) !== miners[0]) {
            miners.splice(0, 1);
        }

        if (miners.length > 0 && awardTransactions[0].transactionBody.targetAddress.toString(16) === miners[0]) {
            miners.splice(0, 1);
        } else {
            return false;
        }


        return transactions.every(transaction =>
            transaction.transactionBody.validTo >= blockCreationTimestamp
            && CryptoJS.SHA256(JSON.stringify(transaction.transactionBody)).toString() === transaction.transactionHash.toString()
            && RSA.verifySignature(transaction.transactionBody, transaction.signature, transaction.transactionBody.sourceAddress || transaction.transactionBody.targetAddress))
    }

}