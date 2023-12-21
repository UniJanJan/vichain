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
        var maxMetricsWidth = width * 1000;
        this.leadingBlocksMetrics.forEach((metrics, nodeId) => {
            var intervals = metrics.getIntervals();

            var currentIntervalIndex = intervals.length - 1;
            var currentMetricsWidth = 0;

            while (currentIntervalIndex >= 0 && currentMetricsWidth < maxMetricsWidth) {
                var currentInterval = intervals[currentIntervalIndex];

                var intervalWidth = currentInterval.size;
                if (currentMetricsWidth + intervalWidth > maxMetricsWidth) {
                    intervalWidth = maxMetricsWidth - currentMetricsWidth;
                }

                graphics.beginPath();
                graphics.rect(startX + currentMetricsWidth / 1000, startY + (nodeId - 1) * nodeMetricsHeight, intervalWidth / 1000, nodeMetricsHeight);
                graphics.fillStyle = currentInterval.object.length > 0 ? currentInterval.object[0] : '#ffffff';
                graphics.fill();

                currentIntervalIndex -= 1;
                currentMetricsWidth += intervalWidth;
            }


        });
    }

}