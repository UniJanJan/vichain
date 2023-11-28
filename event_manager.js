import { AddrMessage, MessageReceivingEvent, MessageSendingEvent, RejectMessage, TransactionCreatingEvent, TransactionVerifyingEvent, TrxMessage, VerAckMessage, VersionMessage, WaitingEvent } from "./event.js";
import { LinkStatus } from "./link.js";

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