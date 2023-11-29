import { LinkStatus } from "./link.js";
import { MessageReceivingEvent } from "./model/events/message_receiving_event.js";
import { MessageSendingEvent } from "./model/events/message_sending_event.js";
import { TransactionCreatingEvent } from "./model/events/transaction_creating_event.js";
import { TransactionVerifyingEvent } from "./model/events/transaction_verifying_event.js";
import { WaitingEvent } from "./model/events/waiting_event.js";
import { RejectMessage } from "./model/messages/reject_message.js";
import { TrxMessage } from "./model/messages/trx_message.js";
import { VerAckMessage } from "./model/messages/verack_message.js";
import { VersionMessage } from "./model/messages/version_message.js";

export class EventManager {
    constructor(node, eventProcessor, networkInterface) {
        this.node = node;
        this.eventProcessor = eventProcessor;
        this.networkInterface = networkInterface;
    }

    wait(name, timeInterval) {
        this.eventProcessor.enqueueExecution(new WaitingEvent(name, timeInterval));
    }

    sendMessages(nodesTo, message) {
        this.eventProcessor.enqueueExecution(new MessageSendingEvent(this.node, nodesTo, message));
    }

    sendMessage(nodeTo, message) {
        this.sendMessages([nodeTo], message);
    }

    broadcastMessage(message) {
        this.sendMessages(this.networkInterface.getAllEstablishedLinkedNodes(), message);
    }

    receiveMessage(nodeFrom, message) {
        this.eventProcessor.enqueueExecution(new MessageReceivingEvent(nodeFrom, this.node, message));
    }

    broadcastTransaction(transaction) {
        this.broadcastMessage(new TrxMessage(transaction));
    }

    canLinkTransmitMessage(link, message) {
        return link.status === LinkStatus.ESTABLISHED ||
            message instanceof VersionMessage ||
            message instanceof VerAckMessage ||
            message instanceof RejectMessage;
    }

    transmitMessageTo(nodeTo, message) {
        var link = this.networkInterface.getLinkWith(nodeTo);
        if (link && this.canLinkTransmitMessage(link, message)) {
            link.transmitMessageTo(nodeTo, message);
        }
    }

    createTransaction(sourceAddress, targetAddress, amount) {
        // needs validation
        this.eventProcessor.enqueueExecution(new TransactionCreatingEvent(this.node, sourceAddress, targetAddress, amount));
    }

    verifyTransaction(transaction) {
        this.eventProcessor.enqueueExecution(new TransactionVerifyingEvent(this.node, transaction));
    }
}