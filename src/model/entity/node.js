import { TransactionPool } from '../transaction/transaction_pool.js';
import { NetworkInterface } from '../../network_interface.js';
import { EventPool } from '../event/event_pool.js';
import { Blockchain } from '../blockchain/blockchain.js';
import { AccountStore } from '../account/account_store.js';


export class Node {
    static nextId = 1;

    static brakingFactor = 0.95;

    constructor(network, x, y, settings) {
        this.id = Node.nextId++;
        this.version = 1;

        this.network = network; // to liquidate?
        this.timer = network.timer;

        this.events = new EventPool();
        this.transactionPool = new TransactionPool();
        this.networkInterface = new NetworkInterface(this, this.network);
        this.blockchain = new Blockchain();
        this.managedAccounts = new AccountStore();

        this.x = x;
        this.y = y;

        this.velocityX = 0;
        this.velocityY = 0;

        this.settings = settings;

        this._radius = null;
        this._autoTransactionCreation = null;
        this._minTransactionCreationInterval = null;
        this._avgTransactionCreationInterval = null;

        this._minLinks = null;
        this._maxLinks = null;

        this.isSelected = false;

        this.targetX = null;
        this.targetY = null;
    }

    get radius() {
        return this._radius || this.settings.defaultNodeRadius;
    }

    get autoTransactionCreation() {
        return this._autoTransactionCreation === null ? this.settings.autoTransactionCreation : this._autoTransactionCreation;
    }

    get minTransactionCreationInterval() {
        return this._minTransactionCreationInterval === null ? this.settings.minTransactionCreationInterval : this._minTransactionCreationInterval;
    }

    get avgTransactionCreationInterval() {
        return this._avgTransactionCreationInterval === null ? this.settings.avgTransactionCreationInterval : this._avgTransactionCreationInterval;
    }

    get maxLinks() {
        return this._maxLinks === null ? this.settings.maxLinksPerNode : this._maxLinks;
    }

    get minLinks() {
        return this._minLinks === null ? this.settings.minLinksPerNode : this._minLinks;
    }

    set autoTransactionCreation(value) {
        this._autoTransactionCreation = value;
    }

    set minTransactionCreationInterval(value) {
        this._minTransactionCreationInterval = value;
    }

    set avgTransactionCreationInterval(value) {
        this._avgTransactionCreationInterval = value;
    }

    set minLinks(value) {
        this._minLinks = value;
    }

    set maxLinks(value) {
        this._maxLinks = value;
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
    }

    draw(graphics, settings) {
        graphics.beginPath();
        graphics.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
        graphics.fillStyle = 'rgb(192, 192, 192)' // silver
        graphics.fill();
        graphics.strokeStyle = this.isSelected ? 'yellow' : 'black';
        graphics.lineWidth = 5;
        graphics.stroke();

        if (this.isSelected) {
            graphics.beginPath();
            graphics.arc(this.x, this.y, this.radius - 3, 0, 2 * Math.PI, false);
            graphics.strokeStyle = 'black';
            graphics.lineWidth = 2;
            graphics.stroke();

            graphics.beginPath();
            graphics.arc(this.x, this.y, this.radius + 3, 0, 2 * Math.PI, false);
            graphics.strokeStyle = 'black';
            graphics.lineWidth = 2;
            graphics.stroke();
        }

        var leadingBlocksNumber = this.blockchain.leadingBlocks.length;
        if (leadingBlocksNumber > 0) {
            var percent = 1 / leadingBlocksNumber;
            this.blockchain.leadingBlocks.forEach((leadingBlock, index) => {
                graphics.beginPath();
                graphics.moveTo(this.x, this.y);
                graphics.arc(this.x, this.y, this.radius - 2, -Math.PI / 2 + 2 * Math.PI * percent * index, -Math.PI / 2 + 2 * Math.PI * percent * (index + 1), false);
                graphics.fillStyle = '#' + leadingBlock.block.blockHash.slice(0, 6);
                graphics.fill();
            });
        }

        this.events.processingEvents
            .filter(event => settings.events[event.constructor.name].isVisible)
            .forEach(event => event.draw(graphics, settings.events[event.constructor.name]));
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