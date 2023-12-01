import { EventProcessor } from "./event_processor.js";
import { Link } from "../link.js";
import { LinkCreatingEvent } from "../model/events/link_creating_event.js";
import { LinkRemovingEvent } from "../model/events/link_removing_event.js";
import { MessageReceivingEvent } from "../model/events/message_receiving_event.js";
import { MessageSendingEvent } from "../model/events/message_sending_event.js";
import { MessageTransmissionEvent } from "../model/events/message_transmission_event.js";
import { NodeCreatingEvent } from "../model/events/node_creating_event.js";
import { TransactionCreatingEvent } from "../model/events/transaction_creating_event.js";
import { TransactionVerifyingEvent } from "../model/events/transaction_verifying_event.js";
import { WaitingEvent } from "../model/events/waiting_event.js";
import { Network } from "../network.js";
import { Node } from "../node.js";
import { LinkCreatingEventHandler } from "./handlers/link_creating_event_handler.js";
import { LinkRemovingEventHandler } from "./handlers/link_removing_event_handler.js";
import { MessageReceivingEventHandler } from "./handlers/message_receiving_event_handler.js";
import { MessageSendingEventHandler } from "./handlers/message_sending_event_handler.js";
import { MessageTransmissionEventHandler } from "./handlers/message_transmission_event_handler.js";
import { NodeCreatingEventHandler } from "./handlers/node_creating_event_handler.js";
import { TransactionCreatingEventHandler } from "./handlers/transaction_creating_event_handler.js";
import { TransactionVerifyingEventHandler } from "./handlers/transaction_verifying_event_handler.js";
import { WaitingEventHandler } from "./handlers/waiting_event_handler.js";

export class EventMaster {
    constructor(network, eventFactory) {
        this.network = network;
        this.timer = network.timer;

        this.eventFactory = eventFactory;

        this.eventProcessors = new Map();
        this.eventProcessors.set(this.network, new EventProcessor(this.timer, Infinity, this.network.events));
        this.network.nodes.forEach(node => {
            this.eventProcessors.set(node, new EventProcessor(this.timer, 1, node.events));
        });
        this.network.links.forEach(link => {
            this.eventProcessors.set(link, new EventProcessor(this.timer, Infinity, link.events));
        });


        this.eventHandler = new Map([
            [Network.name, new Map([
                [NodeCreatingEvent.name, new NodeCreatingEventHandler(this.network, this.eventFactory)],
                [LinkCreatingEvent.name, new LinkCreatingEventHandler(this.network, this.eventFactory)],
                [LinkRemovingEvent.name, new LinkRemovingEventHandler(this.network, this.eventFactory)],
            ])],
            [Node.name, new Map([
                [MessageSendingEvent.name, new MessageSendingEventHandler(this.network, this.eventFactory)],
                [MessageReceivingEvent.name, new MessageReceivingEventHandler(this.network, this.eventFactory)],
                [TransactionCreatingEvent.name, new TransactionCreatingEventHandler(this.network, this.eventFactory)],
                [TransactionVerifyingEvent.name, new TransactionVerifyingEventHandler(this.network, this.eventFactory)],
                [WaitingEvent.name, new WaitingEventHandler(this.network, this.eventFactory)]
            ])],
            [Link.name, new Map([
                [MessageTransmissionEvent.name, new MessageTransmissionEventHandler(this.network, this.eventFactory)]
            ])]
        ]);
    }

    update(elapsedTime) {
        this.eventProcessors.forEach((eventProcessor, processingEntity) => this.updateEventProcessor(processingEntity, eventProcessor, elapsedTime));
    }

    updateEventProcessor(processingEntity, eventProcessor, elapsedTime) {
        var newlyProcessedEvents = eventProcessor.update(elapsedTime);
        newlyProcessedEvents.forEach(newlyProcessedEvent => this.handleEvent(newlyProcessedEvent, processingEntity));
    }

    handleEvent(newlyProcessedEvent, processingEntity) {
        var nextProcessableEvents = this.handleProcessedEvent(processingEntity, newlyProcessedEvent);
        nextProcessableEvents.forEach(this.enqueueExecution.bind(this));
    }

    handleProcessedEvent(processingEntity, newlyProcessedEvent) {
        return this.eventHandler
            .get(processingEntity.constructor.name)
            .get(newlyProcessedEvent.constructor.name)
            .handle(processingEntity, newlyProcessedEvent);
    }

    enqueueExecution(processableEvent) {
        this.getEventProcessor(processableEvent.target)
            .enqueueExecution(processableEvent.event);
    }

    getEventProcessor(processingEntity) {
        var eventProcessor = this.eventProcessors.get(processingEntity);
        if (eventProcessor) {
            return eventProcessor;
        } else {
            if (processingEntity instanceof Node && this.network.constainsNode(processingEntity)) {
                var newNodeEventProcessor = new EventProcessor(this.timer, 1, processingEntity.events);
                this.eventProcessors.set(processingEntity, newNodeEventProcessor);
                return newNodeEventProcessor;
            } else if (processingEntity instanceof Link && this.network.constainsLink(processingEntity)) {
                var newLinkEventProcessor = new EventProcessor(this.timer, Infinity, processingEntity.events);
                this.eventProcessors.set(processingEntity, newLinkEventProcessor);
                return newLinkEventProcessor;
            } else {
                throw new Error("Nonexistent event's target entity!", processingEntity);
            }
        }
    }

}