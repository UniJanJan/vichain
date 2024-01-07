import { Link } from './link.js';
import { EventPool } from '../event/event_pool.js';
import { Timer } from '../time/timer.js';
import { WalletPool } from '../wallet/wallet_pool.js';

export class Network {
    constructor() {
        this.nodes = [];
        this.links = [];

        this.informativeNodes = [];

        this.timer = new Timer();

        this.events = new EventPool();

        this.walletPool = new WalletPool();

        this.settings = {
            minLinksPerNode: 3,
            maxLinksPerNode: 20,

            isBlockchainInstalled: false,
            genesisBlock: null,

            minTransactionCreationInterval: 20000,
            avgTransactionCreationInterval: 100000,

            initTokenAmountPerNode: 100,
            roundTime: 60000,
            minersPerRound: 3,
            maxTransactionsPerBlock: 10,
            miningAward: 100,

            transactionValidityDuration: 100000
        }
    }

    addNode(node) {
        this.nodes.push(node);
    }

    constainsNode(node) {
        return this.nodes.includes(node);
    }

    constainsLink(link) {
        return this.links.includes(link);
    }


    hasInformativeNode(node) {
        return this.informativeNodes.length > 0;
    }

    addInformativeNode(node) {
        this.informativeNodes.push(node);
    }

    addLink(initiatingNode, targetNode) {
        if (initiatingNode.id !== targetNode.id && !initiatingNode.networkInterface.isLinkedWith(targetNode)) {
            var link = new Link(this, initiatingNode, targetNode);
            this.links.push(link);

            // TODO this logic shouldn't be here
            var shouldBePrioritized = initiatingNode.networkInterface.shouldBePrioritized(targetNode); // is it proper here?
            link.prioritizationByNode[initiatingNode] = shouldBePrioritized;
        }
    }

    getNodesNumber() {
        return this.nodes.length;
    }

    update(elapsedTime) {
        this.nodes.forEach(node => node.update(elapsedTime));
        this.links.forEach(link => link.update(elapsedTime));
    }

    draw(graphics, settings, selectedMetrics, canvas) {
        if (!settings.showOnlyMetrics) {
            graphics.beginPath();
            graphics.arc(40, 40, 20, -Math.PI / 2, 3 / 2 * Math.PI, false);
            graphics.strokeStyle = 'grey';
            graphics.lineWidth = 8;
            graphics.stroke();

            graphics.beginPath();
            graphics.arc(40, 40, 28, -Math.PI / 2, 3 / 2 * Math.PI, false);
            graphics.strokeStyle = 'black';
            graphics.lineWidth = 2;
            graphics.stroke();

            if (this.settings.isBlockchainInstalled) {
                var currentTimestamp = this.timer.currentTimestamp;
                var { roundTime, minersPerRound } = this.settings;

                var timeQuantum = roundTime / minersPerRound;

                const minerRoundProgressRatio = (currentTimestamp % timeQuantum) / timeQuantum;
                const roundProgressRatio = (currentTimestamp % roundTime) / roundTime;

                graphics.beginPath();
                graphics.arc(40, 40, 20, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * minerRoundProgressRatio, false);
                graphics.strokeStyle = 'blue';
                graphics.lineWidth = 8;
                graphics.stroke();

                graphics.beginPath();
                graphics.arc(40, 40, 28, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * roundProgressRatio, false);
                graphics.strokeStyle = 'darkblue';
                graphics.lineWidth = 6;
                graphics.stroke();
            }

            if (!settings.isRunning) {
                graphics.beginPath();
                graphics.rect(32, 30, 7, 18);
                graphics.fillStyle = 'red'
                graphics.fill();

                graphics.rect(41, 30, 7, 18);
                graphics.fillStyle = 'red'
                graphics.fill();
            }
        }


        if (selectedMetrics && canvas) {
            var metricsWindowWidth = 240;
            var metricsWindowHeight = 140;
            if (settings.showOnlyMetrics) {
                metricsWindowWidth = canvas.width;
                metricsWindowHeight = canvas.height;
            }

            graphics.beginPath();
            graphics.rect((canvas.width - metricsWindowWidth), (canvas.height - metricsWindowHeight), metricsWindowWidth, metricsWindowHeight);
            graphics.strokeStyle = 'black'
            graphics.lineWidth = 2;
            graphics.stroke();

            selectedMetrics.draw(graphics, (canvas.width - metricsWindowWidth), (canvas.height - metricsWindowHeight), metricsWindowWidth, metricsWindowHeight);
        }
    }

}
