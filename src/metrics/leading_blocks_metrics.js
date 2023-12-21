import { IntervalMap } from "../common/interval_map.js";

export class LeadingBlocksMetrics {

    constructor(network) {
        this.network = network;
        this.leadingBlocksMetrics = new Map();
        this.metricsRetentionTime = 50000;
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
            metrics.forEachReversed((interval, currentMetricsTotalTime) => {
                var shouldStop = false;
                var intervalSize = interval.size;
                if (currentMetricsTotalTime + intervalSize > this.metricsRetentionTime) {
                    shouldStop = true;
                    intervalSize = this.metricsRetentionTime - currentMetricsTotalTime;
                }

                graphics.beginPath();
                graphics.rect(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + (nodeId - 1) * nodeMetricsHeight, intervalSize * widthToTimeFactor, nodeMetricsHeight);
                graphics.fillStyle = interval.object.length > 0 ? interval.object[0] : '#ffffff';
                graphics.fill();

                return shouldStop;
            });

        });

    }

}