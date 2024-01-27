import { IntervalMap } from "../common/interval_map.js";
import { Metrics } from "./metrics.js";

export class ProcessingEventsCountMetrics extends Metrics {

    constructor(network) {
        super(network);
        this.processingEventsCountMetrics = new IntervalMap(false, this.metricsRetentionTime);
        this.maxValue = 5;
    }

    collectMetrics(elapsedTime) {
        var processingEventsCount = 0;
        this.network.nodes.forEach(node => {
            processingEventsCount += node.events.processableEvents.size;
        });
        var averageProcessingEvents = processingEventsCount / (this.network.nodes.length || 1);
        if (Math.ceil(averageProcessingEvents * 1.1) > this.maxValue) {
            this.maxValue = Math.ceil(averageProcessingEvents * 1.1);
        }
        this.processingEventsCountMetrics.push(elapsedTime, averageProcessingEvents);
    }

    draw(graphics, startX, startY, width, height, settings) {
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

        if (settings.showOnlyMetrics) {
            this.drawAxisNames(graphics, startX, startY, height, "Time", "Number of events")
        }
    }

}