import { Utils } from "./common/common.js";
import { RSA } from "./common/rsa.js";
import { EventManager } from "./logic/event_manager.js";
import { EventFactory } from "./logic/factory/event_factory.js";
import { LeadingBlocksMetrics } from "./metrics/leading_blocks_metrics.js";
import { MetricsManager } from "./metrics/metrics_manager.js";
import { Network } from "./model/entity/network.js";
import { Wallet } from "./model/wallet/wallet.js";

export class NetworkManager {
    constructor(network) {
        this.network = network || new Network();
        this.eventFactory = new EventFactory(this.network.settings);
        this.eventManager = new EventManager(this.network, this.eventFactory);
        this.metricsManager = new MetricsManager(this.network);
        // this.canvas = canvas;

        this.selectedNode = null;
        this.currentBlocks = null;
        this.processedEventsPage = 0;

        this.selectedMetrics = LeadingBlocksMetrics.name;
        this.availableMetrics = this.metricsManager.getAvailableMetrics();

        // this.nodePositionsMap = {};
        this.settings = {
            isRunning: false,
            showOnlyMetrics: false,
            simulationSpeed: 1.0,
            events: {
                'MessageSendingEvent': {
                    isVisible: true,
                    color: 'rgb(0, 0, 128)'
                },
                'MessageReceivingEvent': {
                    isVisible: true,
                    color: 'rgb(0, 0, 64)'
                },
                'TransactionCreatingEvent': {
                    isVisible: true,
                    color: 'rgb(212,175,55)'
                },
                'TransactionVerifyingEvent': {
                    isVisible: true,
                    color: 'rgb(192,192,192)'
                },
                'BlockCreatingEvent': {
                    isVisible: true,
                    color: 'rgb(165,165,11)'
                },
                'BlockVerifyingEvent': {
                    isVisible: true,
                    color: 'rgb(165,165,78)'
                },
                'WaitingEvent': {
                    isVisible: null,
                    color: 'rgb(165,42,42)'
                }
            },
            itemsPerPage: 10
        }
    }

    addNode(x, y) {
        this.eventManager.enqueueExecution(this.eventFactory.createNodeCreatingEvent(this.network, x, y));
        this.settings.isRunning = true;
    }

    addLink(initiatingNode, targetNode) {
        this.eventManager.enqueueExecution(this.eventFactory.createLinkCreatingEvent(this.network, initiatingNode, targetNode));
        this.settings.isRunning = true;
    }

    getNode(x, y) {
        for (let index = 0; index < this.network.getNodesNumber(); index++) {
            const node = this.network.nodes[index]; // TODO
            const distance = Utils.distance(node.x, node.y, x, y);
            if (distance <= node.radius) {
                return node;
            }
        }
        return null;
    }

    setSelectedNode(node) { //TODO
        if (this.selectedNode !== null)
            this.selectedNode.isSelected = false;
        this.selectedNode = node;
        node.isSelected = true;
        this.processedEventsPage = 0;
        this.currentBlocks = [...node.blockchain.leadingBlocks];
    }

    unselectNode() {
        if (this.selectedNode !== null)
            this.selectedNode.isSelected = false;
        this.selectedNode = null;
    }

    installBlockchain() {
        this.eventManager.enqueueExecution(this.eventFactory.createBlockchainInstallingEvent(this.network, this.network.nodes));
        this.settings.isRunning = true;
    }

    postTransaction(request) {
        var privateKey = bigInt(request.sourceAddresPrivateKey, 16);
        var publicKey = bigInt(request.sourceAddres, 16);
        this.eventManager.enqueueExecution(this.eventFactory.createTransactionCreatingEvent(this.selectedNode, new Wallet(privateKey, publicKey, RSA.e), request.targetAddress, request.amount));
        this.settings.isRunning = true;
    }

    update(tFrame = 0) { // TODO maybe
        var elapsedTime = this.network.timer.update(tFrame, this.settings.isRunning, this.settings.simulationSpeed);
        if (this.settings.isRunning) {
            this.network.update(elapsedTime);
            this.eventManager.update(elapsedTime);
            this.metricsManager.collectMetrics(elapsedTime);
        }
    }

    draw(graphics) { //TODO
        this.network.draw(graphics, this.settings, this.metricsManager.getMetrics(this.selectedMetrics), this.canvas);
        if (!this.settings.showOnlyMetrics) {
            this.network.links.forEach(link => link.draw(graphics));
            this.network.nodes.forEach(node => node.draw(graphics, this.settings));
        }
    }
}