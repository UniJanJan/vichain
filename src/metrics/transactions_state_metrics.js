import { LinkedList } from "../common/linked_list.js";
import { EventHandler } from "../logic/handler/event_handler.js";
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
        this.maxValue = 5;

        eventHandlerDispositor.registerEventHandler(Node.name, TransactionCreatingEvent.name, new TransactionCreatingMetricsEventHandler(this.network, this.createdTransactionsMetrics));
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

    // constructor(network, createdTransactionsMetrics) {
    //     super(network);
    //     this.createdTransactionsMetrics = createdTransactionsMetrics;
    // }

    // handle(processingNode, processedEvent, baton) {
    //     var createdTransactionsSoFar = this.createdTransactionsMetrics.getLastElement().metricsValue;
    //     this.createdTransactionsMetrics.push({
    //         timestamp: baton.createdTransaction.transactionBody.creationTimestamp,
    //         metricsValue: createdTransactionsSoFar + 1
    //     });
    // }
}
