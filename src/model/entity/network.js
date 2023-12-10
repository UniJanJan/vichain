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
            roundTime: 180000,
            minersPerRound: 3,
            maxTransactionsPerBlock: 10,
            miningAward: 80,

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

}
