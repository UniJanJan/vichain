import { LinkStatus } from './link.js';
import { EventProcessor } from './event_processor.js';
import { MessageSendingEvent, MessageReceivingEvent, VersionMessage, VerAckMessage, WaitingEvent, AddrMessage, TrxMessage, GetAddrMessage, TransactionCreatingEvent, TransactionVerifyingEvent, RejectMessage } from './event.js';
import { Utils } from './common.js';
import { TransactionPool } from './transaction_pool.js';
import { Transaction } from './transaction.js';
import { NetworkInterface } from './network_interface.js';
import { EventManager } from './event_manager.js';

const CyclicEventsName = {
    SENDING_ADDRESS: 'addr',
    PEERS_DISCOVERY: 'peers_discovery'
}

export class Node {
    static nextId = 1;

    static brakingFactor = 0.95;

    constructor(network, x, y) {
        this.id = Node.nextId++;
        this.version = 1;

        this.network = network;
        this.timer = network.timer;

        this.transactionPool = new TransactionPool();
        this.eventProcessor = new EventProcessor(this.timer, 1, this.onProcessed.bind(this));
        this.networkInterface = new NetworkInterface(this, this.network, this.eventProcessor);
        this.eventManager = new EventManager(this, this.eventProcessor, this.networkInterface);

        this.x = x;
        this.y = y;

        this.velocityX = 0;
        this.velocityY = 0;

        this.radius = 20;
        this.isSelected = false;

        this.targetX = null;
        this.targetY = null;

        // this.eventManager.wait(CyclicEventsName.SENDING_ADDRESS, 60000);
        this.eventManager.wait(CyclicEventsName.PEERS_DISCOVERY, 1000);
    }

    onProcessed(processedEvent) {
        if (processedEvent instanceof MessageSendingEvent) {
            // TODO what if link has been destroyed?
            processedEvent.nodesTo.forEach(nodeTo => {
                this.eventManager.transmitMessageTo(nodeTo, Object.isFrozen(processedEvent.message) ? processedEvent.message : processedEvent.message.clone());
            });

        } else if (processedEvent instanceof MessageReceivingEvent) {
            this.dispatchMessage(processedEvent);
        } else if (processedEvent instanceof WaitingEvent) {
            switch (processedEvent.name) {
                case CyclicEventsName.SENDING_ADDRESS:
                    this.eventManager.broadcastMessage(new AddrMessage(this.networkInterface.getAllLinkableNodes()));
                    this.eventManager.wait(CyclicEventsName.SENDING_ADDRESS, 360000);
                    break;
                case CyclicEventsName.PEERS_DISCOVERY:
                    this.updateLinks();
                    this.eventManager.broadcastMessage(new GetAddrMessage());
                    this.eventManager.wait(CyclicEventsName.PEERS_DISCOVERY, 60000 + ((Math.random() * 60000) - 30000));
                    break;

            }
        } else if (processedEvent instanceof TransactionCreatingEvent) {
            var transaction = new Transaction(processedEvent.sourceAddress, processedEvent.targetAddress, processedEvent.amount);
            this.transactionPool.put(transaction);
            this.eventManager.broadcastTransaction(transaction);
        } else if (processedEvent instanceof TransactionVerifyingEvent) {
            var transaction = processedEvent.transaction;
            if (!this.transactionPool.contains(transaction)) {
                this.transactionPool.put(transaction);
                this.eventManager.broadcastTransaction(transaction);
            }
        }
    }

    dispatchMessage(event) {
        if (event.message instanceof VersionMessage) {
            this.networkInterface.rememberNode(event.nodeFrom);

            if (this.networkInterface.getAtLeastHalfEstablishedLinkedNodes().length < this.network.settings.maxLinksPerNode) {
                var link = this.networkInterface.getLinkWith(event.nodeFrom);
                var shouldBePrioritized = this.networkInterface.shouldBePrioritized(event.nodeFrom);
                if (link && link.status === LinkStatus.VIRTUAL) {
                    //TODO make prioritized
                    this.eventManager.sendMessage(event.nodeFrom, new VerAckMessage());
                    this.eventManager.sendMessage(event.nodeFrom, new VersionMessage(this.version, shouldBePrioritized));
                } else if (link && link.status === LinkStatus.HALF_ESTABLISHED) {
                    link.prioritizationByNode[event.nodeFrom] = event.message.shouldBePrioritized;
                    this.eventManager.sendMessage(event.nodeFrom, new VerAckMessage());
                }
            } else {
                this.eventManager.sendMessage(event.nodeFrom, new RejectMessage());
            }
        } else if (event.message instanceof VerAckMessage) {
            this.networkInterface.confirmLinkWith(event.nodeFrom);
        } else if (event.message instanceof RejectMessage) {
            this.networkInterface.rejectLinkWith(event.nodeFrom);
        } else if (event.message instanceof AddrMessage) {
            // this.networkInterface.rememberNodes.bind(this.networkInterface)(event.message.linkedNodes)
            event.message.linkedNodes.forEach(this.networkInterface.rememberNode.bind(this.networkInterface));
            this.updateLinks();
        } else if (event.message instanceof TrxMessage) {
            this.eventManager.verifyTransaction(event.message.transaction);
        } else if (event.message instanceof GetAddrMessage) {
            this.eventManager.sendMessage(event.nodeFrom, new AddrMessage(this.networkInterface.getAllLinkableNodes()));
        }
    }

    updateLinks() {
        var classification = this.networkInterface.getLinkableNodesClassification();

        classification.toLink.forEach(node => {
            var link = this.networkInterface.getLinkWith(node);
            if (link && !link.prioritizationByNode[this]) {
                // TODO
            } else if (!link) {
                this.networkInterface.linkWith.bind(this.networkInterface)(node);
            }
        });

        classification.toReject.forEach(node => {
            var link = this.networkInterface.getLinkWith(node);
            this.networkInterface.rejectLinkWith(node);
            this.eventManager.sendMessage(node, new RejectMessage());
        });
    }

    updateVelocity(elapsedTime) {
        if (this.targetX !== null && this.targetY !== null) {
            this.velocityX = (this.targetX - this.x) / 10;
            this.velocityY = (this.targetY - this.y) / 10;
        } else {
            this.velocityX *= Node.brakingFactor;
            this.velocityY *= Node.brakingFactor;
        }
    }

    updatePosition(elapsedTime) {
        this.x += this.velocityX * elapsedTime / 16;
        this.y += this.velocityY * elapsedTime / 16;

        if (this.velocityX !== 0 || this.velocityY !== 0) {
            Object.values(this.networkInterface.linkedNodes).forEach(link => link.calculateProperties());
        }
    }

    update(elapsedTime) {
        this.updateVelocity(elapsedTime);
        this.updatePosition(elapsedTime);
        this.eventProcessor.update(elapsedTime);

        if (this.networkInterface.getLinksNumber() < this.network.settings.minLinksPerNode && Math.random() < 0.001) {
            // console.log(this.network.settings.minLinksPerNode)
            this.eventManager.broadcastMessage(new GetAddrMessage());
        }

        // // for testing
        // if (this.id !== 1 && Math.random() < 0.0001) {
        //     this.eventManager.createTransaction("SOURCEADDR", "TARGETADDR", 10);
        // }
    }

    draw(graphics) {
        graphics.beginPath();
        graphics.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        graphics.fillStyle = this.isSelected ? 'yellow' : 'blue';
        graphics.fill();
        graphics.strokeStyle = 'black';
        graphics.lineWidth = 3;
        graphics.stroke();

        this.eventProcessor.processingEvents.forEach(event => event.draw(graphics, this));
    }

    updateTargetPoint(targetX, targetY) {
        this.targetX = targetX;
        this.targetY = targetY;
    }

    abandonTargetPoint() {
        this.targetX = null;
        this.targetY = null;
    }

    toString() {
        return `Node-${this.id}`
    }
}