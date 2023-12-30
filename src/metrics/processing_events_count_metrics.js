import { IntervalMap } from "../common/interval_map.js";
import { Metrics } from "./metrics.js";

export class ProcessingEventsCountMetrics extends Metrics {

    constructor(network) {
        super(network);
        this.processingEventsCountMetrics = new IntervalMap(false, this.metricsRetentionTime);
        this.maxValue = 20;
    }

    collectMetrics(elapsedTime) {
        var processingEventsCount = 0;
        this.network.nodes.forEach(node => {
            processingEventsCount += node.events.processableEvents.size;
        });
        if ((processingEventsCount * 1.1) > this.maxValue) {
            this.maxValue = processingEventsCount * 1.1;
        }
        this.processingEventsCountMetrics.push(elapsedTime, processingEventsCount);
    }

    draw(graphics, startX, startY, width, height) {
        var widthToTimeFactor = width / this.metricsRetentionTime;
        var heightToMaxValue = height / this.maxValue;

        this.processingEventsCountMetrics.forEachReversed((interval, nextInterval, currentMetricsTotalTime) => {
            var shouldStop = false;
            var intervalSize = interval.size;
            if (currentMetricsTotalTime + intervalSize > this.metricsRetentionTime) {
                shouldStop = true;
                intervalSize = this.metricsRetentionTime - currentMetricsTotalTime;
            }

            var metricsValue = interval.object;
            var nextMetricsValue = nextInterval ? nextInterval.object : metricsValue;


            graphics.beginPath();
            graphics.moveTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime) * widthToTimeFactor, startY + height - metricsValue * heightToMaxValue);
            graphics.lineTo(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + height - nextMetricsValue * heightToMaxValue);
            graphics.strokeStyle = 'black';
            graphics.stroke();

            return shouldStop;
        });
    }

}