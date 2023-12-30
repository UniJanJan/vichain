import { IntervalMap } from "../common/interval_map.js";
import { Metrics } from "./metrics.js";

export class LeadingBlocksMetrics extends Metrics {

    constructor(network) {
        super(network);
        this.leadingBlocksMetrics = new Map();
    }

    collectMetrics(elapsedTime) {
        this.network.nodes.forEach(node => {
            var leadingBlocksHashesColors = node.blockchain.leadingBlocks.map(leadingBlock => '#' + leadingBlock.block.blockHash.slice(0, 6));
            var nodeLeadingBlocksMetrics = this.leadingBlocksMetrics.get(node.id);
            if (!nodeLeadingBlocksMetrics) {
                nodeLeadingBlocksMetrics = new IntervalMap(false, this.metricsRetentionTime);
                nodeLeadingBlocksMetrics.push(this.network.timer.currentTimestamp, []);
                this.leadingBlocksMetrics.set(node.id, nodeLeadingBlocksMetrics);
            }
            nodeLeadingBlocksMetrics.push(elapsedTime, leadingBlocksHashesColors);
        });
    }

    draw(graphics, startX, startY, width, height) {
        var nodeMetricsHeight = height / this.leadingBlocksMetrics.size;
        var widthToTimeFactor = width / this.metricsRetentionTime;

        this.leadingBlocksMetrics.forEach((metrics, nodeId) => {
            metrics.forEachReversed((interval, _, currentMetricsTotalTime) => {
                var shouldStop = false;
                var intervalSize = interval.size;
                if (currentMetricsTotalTime + intervalSize > this.metricsRetentionTime) {
                    shouldStop = true;
                    intervalSize = this.metricsRetentionTime - currentMetricsTotalTime;
                }

                var leadingBlocksColorsNumber = interval.object.length;
                var leadingBlocksColors = leadingBlocksColorsNumber > 0 ? interval.object : ['#ffffff'];

                leadingBlocksColors.forEach((leadingBlockColor, index) => {
                    var segmentHeight = nodeMetricsHeight / leadingBlocksColorsNumber;

                    graphics.beginPath();
                    graphics.rect(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + (nodeId - 1) * nodeMetricsHeight + index * segmentHeight, intervalSize * widthToTimeFactor, segmentHeight);
                    graphics.fillStyle = leadingBlockColor;
                    graphics.fill();
                })

                return shouldStop;
            });

        });

    }

}