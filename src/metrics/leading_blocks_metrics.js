import { IntervalMap } from "../common/interval_map.js";

export class LeadingBlocksMetrics {

    constructor(network) {
        this.network = network;
        this.leadingBlocksMetrics = new Map();
        this.metricsRetentionTime = 100000;
    }

    collectMetrics(elapsedTime) {
        this.network.nodes.forEach(node => {
            var leadingBlocksHashesColors = node.blockchain.leadingBlocks.map(leadingBlock => '#' + leadingBlock.block.blockHash.slice(0, 6));
            var nodeLeadingBlocksMetrics = this.leadingBlocksMetrics.get(node.id);
            if (!nodeLeadingBlocksMetrics) {
                nodeLeadingBlocksMetrics = new IntervalMap();
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
            var intervals = metrics.getIntervals();

            var currentIntervalIndex = intervals.length - 1;
            var currentMetricsTotalTime = 0;

            while (currentIntervalIndex >= 0 && currentMetricsTotalTime < this.metricsRetentionTime) {
                var currentInterval = intervals[currentIntervalIndex];

                var intervalTime = currentInterval.size;
                if (currentMetricsTotalTime + intervalTime > this.metricsRetentionTime) {
                    intervalTime = this.metricsRetentionTime - currentMetricsTotalTime;
                }

                graphics.beginPath();
                graphics.rect(startX + currentMetricsTotalTime * widthToTimeFactor, startY + (nodeId - 1) * nodeMetricsHeight, intervalTime * widthToTimeFactor, nodeMetricsHeight);
                graphics.fillStyle = currentInterval.object.length > 0 ? currentInterval.object[0] : '#ffffff';
                graphics.fill();

                currentIntervalIndex -= 1;
                currentMetricsTotalTime += intervalTime;
            }

        });

    }

}