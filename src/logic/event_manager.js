import { EventProcessor } from "./event_processor.js";
import { Link } from "../model/entity/link.js";
import { LinkCreatingEvent } from "../model/event/link_creating_event.js";
import { LinkRemovingEvent } from "../model/event/link_removing_event.js";
import { MessageReceivingEvent } from "../model/event/message_receiving_event.js";
import { MessageSendingEvent } from "../model/event/message_sending_event.js";
import { MessageTransmissionEvent } from "../model/event/message_transmission_event.js";
import { NodeCreatingEvent } from "../model/event/node_creating_event.js";
import { TransactionCreatingEvent } from "../model/event/transaction_creating_event.js";
import { TransactionVerifyingEvent } from "../model/event/transaction_verifying_event.js";
import { WaitingEvent } from "../model/event/waiting_event.js";
import { Network } from "../model/entity/network.js";
import { Node } from "../model/entity/node.js";
import { LinkCreatingEventHandler } from "./handler/link_creating_event_handler.js";
import { LinkRemovingEventHandler } from "./handler/link_removing_event_handler.js";
import { MessageReceivingEventHandler } from "./handler/message_receiving_event_handler.js";
import { MessageSendingEventHandler } from "./handler/message_sending_event_handler.js";
import { MessageTransmissionEventHandler } from "./handler/message_transmission_event_handler.js";
import { NodeCreatingEventHandler } from "./handler/node_creating_event_handler.js";
import { TransactionCreatingEventHandler } from "./handler/transaction_creating_event_handler.js";
import { TransactionVerifyingEventHandler } from "./handler/transaction_verifying_event_handler.js";
import { WaitingEventHandler } from "./handler/waiting_event_handler.js";
import { BlockchainInstallingEvent } from "../model/event/blockchain_installing_event.js";
import { BlockchainInstallingEventHandler } from "./handler/blockchain_installing_event_handler.js";
import { BlockVerifyingEvent } from "../model/event/block_verifying_event.js";
import { BlockVerifyingEventHandler } from "./handler/block_verifying_event_handler.js";
import { BlockCreatingEvent } from "../model/event/block_creating_event.js";
import { BlockCreatingEventHandler } from "./handler/block_creating_event_handler.js";
import { ServiceDispositor } from "./service/service_dispositor.js";

export class EventManager {
    constructor(network, eventFactory) {
        this.network = network;
        this.timer = network.timer;

        this.eventFactory = eventFactory;
        this.serviceDispositor = new ServiceDispositor(this.network);

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
                [NodeCreatingEvent.name, new NodeCreatingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [LinkCreatingEvent.name, new LinkCreatingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [LinkRemovingEvent.name, new LinkRemovingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [BlockchainInstallingEvent.name, new BlockchainInstallingEventHandler(this.network, this.eventFactory, this.serviceDispositor)]
            ])],
            [Node.name, new Map([
                [MessageSendingEvent.name, new MessageSendingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [MessageReceivingEvent.name, new MessageReceivingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [TransactionCreatingEvent.name, new TransactionCreatingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [TransactionVerifyingEvent.name, new TransactionVerifyingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [BlockCreatingEvent.name, new BlockCreatingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [BlockVerifyingEvent.name, new BlockVerifyingEventHandler(this.network, this.eventFactory, this.serviceDispositor)],
                [WaitingEvent.name, new WaitingEventHandler(this.network, this.eventFactory, this.serviceDispositor)]
            ])],
            [Link.name, new Map([
                [MessageTransmissionEvent.name, new MessageTransmissionEventHandler(this.network, this.eventFactory, this.serviceDispositor)]
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