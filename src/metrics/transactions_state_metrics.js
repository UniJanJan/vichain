import { LinkedList } from "../common/linked_list.js";
import { EventHandler } from "../logic/handler/event_handler.js";
import { Network } from "../model/entity/network.js";
import { BlockCreatingEvent } from "../model/event/block_creating_event.js";
import { BlockVerifyingEvent } from "../model/event/block_verifying_event.js";
import { BlockchainInstallingEvent } from "../model/event/blockchain_installing_event.js";
import { TransactionCreatingEvent } from "../model/event/transaction_creating_event.js";
import { PlotMetricsArchetype } from "./archetype/plot_metrics_archetype.js";
import { Metrics } from "./metrics.js";

export class TransactionsStateMetrics extends Metrics {

    constructor(network, eventHandlerDispositor) {
        super(network, eventHandlerDispositor);

        this.createdTransactionsMetrics = new PlotMetricsArchetype();

        this.committedTransactionsMetrics = new Map();

        this.maxValue = 5;

        eventHandlerDispositor.registerEventHandler(Node.name, TransactionCreatingEvent.name, new TransactionCreatingMetricsEventHandler(this.network, this.createdTransactionsMetrics));
        eventHandlerDispositor.registerEventHandler(Node.name, BlockCreatingEvent.name, new BlockCreatingMetricsEventHandler(this.network, this.committedTransactionsMetrics, this.createdTransactionsMetrics));
        eventHandlerDispositor.registerEventHandler(Node.name, BlockVerifyingEvent.name, new BlockVerifyingMetricsEventHandler(this.network, this.committedTransactionsMetrics, this.createdTransactionsMetrics));
        eventHandlerDispositor.registerEventHandler(Network.name, BlockchainInstallingEvent.name, new BlockchainInstallingMetricsEventHandler(this.network, this.createdTransactionsMetrics));
    }

    collectMetrics(elapsedTime) {

    }

    draw(graphics, startX, startY, width, height) {
        var currentTimestamp = this.network.timer.currentTimestamp;

        var widthToTimeFactor = width / this.metricsRetentionTime;
        var heightToMaxValue = height / this.maxValue;

        var lastTimestamp = currentTimestamp;
        var currentMetricsTotalTime = 0;
        var previousMetricsValue = null;

        var maxCreatedTransactionsNumber = 0;

        this.createdTransactionsMetrics.metrics.forEachReversed(element => {
            var shouldStop = false;
            var intervalSize = lastTimestamp - element.timestamp;
            if (currentMetricsTotalTime + intervalSize > this.metricsRetentionTime) {
                shouldStop = true;
                intervalSize = this.metricsRetentionTime - currentMetricsTotalTime;
            }

            var metricsValue = element.value;

            if (Math.ceil(metricsValue * 1.1) > this.maxValue) {
                this.maxValue = Math.ceil(metricsValue * 1.1);
            }

            if (maxCreatedTransactionsNumber < metricsValue) {
                maxCreatedTransactionsNumber = metricsValue;
            }

            graphics.beginPath();
            graphics.rect(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue, intervalSize * widthToTimeFactor, metricsValue * heightToMaxValue);
            graphics.fillStyle = 'grey';
            graphics.fill();

            graphics.beginPath();
            graphics.moveTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue);
            graphics.lineTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue);
            graphics.strokeStyle = 'black';
            graphics.stroke();

            if (previousMetricsValue) {
                graphics.beginPath();
                graphics.moveTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue);
                graphics.lineTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime) * widthToTimeFactor, startY + height - previousMetricsValue * heightToMaxValue);
                graphics.strokeStyle = 'black';
                graphics.stroke();
            }

            lastTimestamp = element.timestamp;
            currentMetricsTotalTime += intervalSize;
            previousMetricsValue = metricsValue;

            return shouldStop;
        });


        this.committedTransactionsMetrics.forEach(metrics => {
            var lastTimestamp = currentTimestamp;
            var currentMetricsTotalTime = 0;
            metrics.forEachReversed(element => {
                var shouldStop = false;
                var intervalSize = lastTimestamp - element.timestamp;
                if (currentMetricsTotalTime + intervalSize > this.metricsRetentionTime) {
                    shouldStop = true;
                    intervalSize = this.metricsRetentionTime - currentMetricsTotalTime;
                }

                var metricsValue = element.metricsValue;

                if (Math.ceil(metricsValue * 1.1) > this.maxValue) {
                    this.maxValue = Math.ceil(metricsValue * 1.1);
                }

                graphics.beginPath();
                graphics.rect(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue, intervalSize * widthToTimeFactor, metricsValue * heightToMaxValue);
                graphics.fillStyle = 'red';
                graphics.fill();

                lastTimestamp = element.timestamp;
                currentMetricsTotalTime += intervalSize;
                previousMetricsValue = metricsValue;

                return shouldStop;
            });
        })

        this.committedTransactionsMetrics.forEach((metrics, blockHash) => {
            var lastTimestamp = currentTimestamp;
            var currentMetricsTotalTime = 0;
            var previousMetricsValue = null;
            metrics.forEachReversed(element => {
                var shouldStop = false;
                var intervalSize = lastTimestamp - element.timestamp;
                if (currentMetricsTotalTime + intervalSize > this.metricsRetentionTime) {
                    shouldStop = true;
                    intervalSize = this.metricsRetentionTime - currentMetricsTotalTime;
                }

                var metricsValue = element.metricsValue;

                graphics.beginPath();
                graphics.moveTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue);
                graphics.lineTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue);
                graphics.strokeStyle = '#' + blockHash.slice(0, 6);
                graphics.lineWidth = 3;
                graphics.stroke();

                if (previousMetricsValue) {
                    graphics.beginPath();
                    graphics.moveTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue);
                    graphics.lineTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime) * widthToTimeFactor, startY + height - previousMetricsValue * heightToMaxValue);
                    graphics.strokeStyle = '#' + blockHash.slice(0, 6);
                    graphics.lineWidth = 3;
                    graphics.stroke();
                }

                lastTimestamp = element.timestamp;
                currentMetricsTotalTime += intervalSize;
                previousMetricsValue = metricsValue;

                return shouldStop;
            });
        });


        graphics.beginPath();
        graphics.moveTo(startX, startY + height - maxCreatedTransactionsNumber * heightToMaxValue);
        graphics.lineTo(startX + 5, startY + height - maxCreatedTransactionsNumber * heightToMaxValue);
        graphics.strokeStyle = 'blue';
        graphics.stroke();

        graphics.fillStyle = 'blue';
        graphics.font = "12px arial";
        graphics.fillText(maxCreatedTransactionsNumber, startX + 10, startY + height - maxCreatedTransactionsNumber * heightToMaxValue + 3);

        graphics.beginPath();
        graphics.setLineDash([3, 6]);
        graphics.moveTo(startX + 30, startY + height - maxCreatedTransactionsNumber * heightToMaxValue);
        graphics.lineTo(startX + width, startY + height - maxCreatedTransactionsNumber * heightToMaxValue);
        graphics.strokeStyle = 'blue';
        graphics.stroke();
        graphics.setLineDash([]);
    }

}

class BlockchainInstallingMetricsEventHandler extends EventHandler {
    constructor(network, createdTransactionsMetrics) {
        super(network);
        this.createdTransactionsMetrics = createdTransactionsMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        var timestamp = baton.genesisBlock.blockBody.creationTimestamp;

        this.createdTransactionsMetrics.noteMetrics(timestamp, baton.genesisBlock.blockBody.transactions.length);
    }
}

class TransactionCreatingMetricsEventHandler extends EventHandler {

    constructor(network, createdTransactionsMetrics) {
        super(network);
        this.createdTransactionsMetrics = createdTransactionsMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        var timestamp = baton.createdTransaction.transactionBody.creationTimestamp;
        var createdTransactionsSoFar = this.createdTransactionsMetrics.getMetricsLastValue();

        this.createdTransactionsMetrics.noteMetrics(timestamp, createdTransactionsSoFar + 1);
    }

}

class BlockCreatingMetricsEventHandler extends EventHandler {

    constructor(network, committedTransactionsMetrics, createdTransactionsMetrics) {
        super(network);
        this.committedTransactionsMetrics = committedTransactionsMetrics;
        this.createdTransactionsMetrics = createdTransactionsMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        if (baton.createdBlock) {
            var createdAwardTransaction = baton.createdBlock.blockBody.transactions.at(-1);
            var timestamp = createdAwardTransaction.transactionBody.creationTimestamp;
            var createdTransactionsSoFar = this.createdTransactionsMetrics.getMetricsLastValue();

            this.createdTransactionsMetrics.noteMetrics(timestamp, createdTransactionsSoFar + 1);
        }

        if (baton.createdBlock && baton.isBlockAppended) {
            var committedTransactionsForBlockMetrics = this.committedTransactionsMetrics.get(baton.createdBlock.blockBody.previousBlockHash);

            if (!committedTransactionsForBlockMetrics) {
                committedTransactionsForBlockMetrics = new LinkedList();
                committedTransactionsForBlockMetrics.push({
                    timestamp: 0,
                    metricsValue: 0
                });
                this.committedTransactionsMetrics.set(baton.createdBlock.blockHash, committedTransactionsForBlockMetrics);
            } else {
                committedTransactionsForBlockMetrics = committedTransactionsForBlockMetrics.clone(false);
            }

            var committedTransactionsSoFar = committedTransactionsForBlockMetrics.getLastElement()?.metricsValue || 0;

            committedTransactionsForBlockMetrics.push({
                timestamp: baton.createdBlock.blockBody.creationTimestamp,
                metricsValue: committedTransactionsSoFar + baton.createdBlock.blockBody.transactions.length
            });

            this.committedTransactionsMetrics.set(baton.createdBlock.blockHash, committedTransactionsForBlockMetrics);

            Array.from(this.committedTransactionsMetrics.keys()).forEach(blockHash => {
                if (!baton.nodesIdsByLeadingBlock.has(blockHash)) {
                    this.committedTransactionsMetrics.delete(blockHash);
                }
            })
        }
    }
}

class BlockVerifyingMetricsEventHandler extends EventHandler {

    constructor(network, committedTransactionsMetrics, createdTransactionsMetrics) {
        super(network);
        this.committedTransactionsMetrics = committedTransactionsMetrics;
        this.createdTransactionsMetrics = createdTransactionsMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        if (baton.verifiedBlock && baton.isBlockAppended) {

            if (baton.nodesIdsByLeadingBlock.get(baton.verifiedBlock.blockHash).nodesIds.size === 1) {
                var committedTransactionsForBlockMetrics = this.committedTransactionsMetrics.get(baton.verifiedBlock.blockBody.previousBlockHash);

                if (!committedTransactionsForBlockMetrics) {
                    committedTransactionsForBlockMetrics = new LinkedList();
                    committedTransactionsForBlockMetrics.push({
                        timestamp: 0,
                        metricsValue: 0
                    });
                    this.committedTransactionsMetrics.set(baton.verifiedBlock.blockHash, committedTransactionsForBlockMetrics);
                } else {
                    committedTransactionsForBlockMetrics = committedTransactionsForBlockMetrics.clone(false);
                }

                var committedTransactionsSoFar = committedTransactionsForBlockMetrics.getLastElement()?.metricsValue || 0;

                committedTransactionsForBlockMetrics.push({
                    timestamp: baton.verifiedBlock.blockBody.creationTimestamp,
                    metricsValue: committedTransactionsSoFar + baton.verifiedBlock.blockBody.transactions.length
                });

                this.committedTransactionsMetrics.set(baton.verifiedBlock.blockHash, committedTransactionsForBlockMetrics);
            }

            Array.from(this.committedTransactionsMetrics.keys()).forEach(blockHash => {
                if (!baton.nodesIdsByLeadingBlock.has(blockHash)) {
                    this.committedTransactionsMetrics.delete(blockHash);
                }
            })
        }

    }

}
