import { LinkedList } from "../common/linked_list.js";
import { EventHandler } from "../logic/handler/event_handler.js";
import { BlockCreatingEvent } from "../model/event/block_creating_event.js";
import { TransactionCreatingEvent } from "../model/event/transaction_creating_event.js";
import { Metrics } from "./metrics.js";

export class TransactionsStateMetrics extends Metrics {

    constructor(network, eventHandlerDispositor) {
        super(network, eventHandlerDispositor);

        this.createdTransactionsMetrics = new LinkedList();
        this.createdTransactionsMetrics.push({
            timestamp: 0,
            metricsValue: 0
        })

        this.committedTransactionsMetrics = new Map();

        this.maxValue = 5;

        eventHandlerDispositor.registerEventHandler(Node.name, TransactionCreatingEvent.name, new TransactionCreatingMetricsEventHandler(this.network, this.createdTransactionsMetrics));
        eventHandlerDispositor.registerEventHandler(Node.name, BlockCreatingEvent.name, new BlockCreatingMetricsEventHandler(this.network, this.committedTransactionsMetrics));
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
        this.createdTransactionsMetrics.forEachReversed(element => {
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
    
                if (Math.ceil(metricsValue * 1.1) > this.maxValue) {
                    this.maxValue = Math.ceil(metricsValue * 1.1);
                }
    
                graphics.beginPath();
                graphics.rect(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue, intervalSize * widthToTimeFactor, metricsValue * heightToMaxValue);
                graphics.fillStyle = 'red';
                graphics.fill();
    
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
        })


        graphics.beginPath();
        graphics.moveTo(startX, startY + height / 2);
        graphics.lineTo(startX + 5, startY + height / 2);
        graphics.strokeStyle = 'blue';
        graphics.stroke();

        graphics.fillStyle = 'blue';
        graphics.font = "12px arial";
        graphics.fillText(Math.ceil(this.maxValue / 2), startX + 10, startY + height / 2 + 3);

        graphics.beginPath();
        graphics.setLineDash([3, 6]);
        graphics.moveTo(startX + 30, startY + height / 2);
        graphics.lineTo(startX + width, startY + height / 2);
        graphics.strokeStyle = 'blue';
        graphics.stroke();
        graphics.setLineDash([]);

    }

}

class TransactionCreatingMetricsEventHandler extends EventHandler {

    constructor(network, createdTransactionsMetrics) {
        super(network);
        this.createdTransactionsMetrics = createdTransactionsMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        var createdTransactionsSoFar = this.createdTransactionsMetrics.getLastElement().metricsValue;
        this.createdTransactionsMetrics.push({
            timestamp: baton.createdTransaction.transactionBody.creationTimestamp,
            metricsValue: createdTransactionsSoFar + 1
        });
    }

}

class BlockCreatingMetricsEventHandler extends EventHandler {

    constructor(network, committedTransactionsMetrics) {
        super(network);
        this.committedTransactionsMetrics = committedTransactionsMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        if (baton.createdBlock && baton.isBlockAppended) {
            var committedTransactionsForBlockMetrics = this.committedTransactionsMetrics.get(baton.createdBlock.blockBody.previousBlockHash);

            if (!committedTransactionsForBlockMetrics) {
                committedTransactionsForBlockMetrics = new LinkedList();
                committedTransactionsForBlockMetrics.push({
                    timestamp: 0,
                    metricsValue: 0
                });
                this.committedTransactionsMetrics.set(baton.createdBlock.blockHash, committedTransactionsForBlockMetrics);
            }

            var committedTransactionsSoFar = committedTransactionsForBlockMetrics.getLastElement()?.metricsValue || 0;

            committedTransactionsForBlockMetrics.push({
                timestamp: baton.createdBlock.blockBody.creationTimestamp,
                metricsValue: committedTransactionsSoFar + baton.createdBlock.blockBody.transactions.length - 1
            });

            this.committedTransactionsMetrics.set(baton.createdBlock.blockHash, committedTransactionsForBlockMetrics);
            this.committedTransactionsMetrics.delete(baton.createdBlock.blockBody.previousBlockHash);
            
        }
    }
}
