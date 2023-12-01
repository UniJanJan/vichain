import { TransactionPool } from '../../transaction_pool.js';
import { NetworkInterface } from '../../network_interface.js';
import { EventPool } from '../event/event_pool.js';


export class Node {
    static nextId = 1;

    static brakingFactor = 0.95;

    constructor(network, x, y) {
        this.id = Node.nextId++;
        this.version = 1;

        this.network = network; // to liquidate?
        this.timer = network.timer;

        this.events = new EventPool();
        this.transactionPool = new TransactionPool();
        this.networkInterface = new NetworkInterface(this, this.network);

        this.x = x;
        this.y = y;

        this.velocityX = 0;
        this.velocityY = 0;

        this.radius = 20;
        this.isSelected = false;

        this.targetX = null;
        this.targetY = null;
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
        graphics.fillStyle = this.isSelected ? 'yellow' : 'blue';
        graphics.fill();
        graphics.strokeStyle = 'black';
        graphics.lineWidth = 3;
        graphics.stroke();

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