import { LinkedList } from "../common/linked_list.js";
import { EventHandler } from "../logic/handler/event_handler.js";
import { BlockCreatingEvent } from "../model/event/block_creating_event.js";
import { BlockVerifyingEvent } from "../model/event/block_verifying_event.js";
import { Metrics } from "./metrics.js";

export class LeadingBlocksMetrics extends Metrics {

    constructor(network, eventHandlerDispositor) {
        super(network, eventHandlerDispositor);
        this.leadingBlocksMetrics = new Map();

        eventHandlerDispositor.registerEventHandler(Node.name, BlockCreatingEvent.name, new BlockCreatingMetricsEventHandler(this.network, this.leadingBlocksMetrics));
        eventHandlerDispositor.registerEventHandler(Node.name, BlockVerifyingEvent.name, new BlockVeryfingMetricsEventHandler(this.network, this.leadingBlocksMetrics));
    }

    collectMetrics(elapsedTime) {

    }

    draw(graphics, startX, startY, width, height, settings) {
        var currentTimestamp = this.network.timer.currentTimestamp;

        var nodeMetricsHeight = height / this.leadingBlocksMetrics.size;
        var widthToTimeFactor = width / this.metricsRetentionTime;

        this.leadingBlocksMetrics.forEach((metrics, nodeId) => {
            var lastTimestamp = currentTimestamp;
            var currentMetricsTotalTime = 0;
            metrics.forEachReversed(element => {
                var shouldStop = false;
                var intervalSize = lastTimestamp - element.timestamp;
                if (currentMetricsTotalTime + intervalSize > this.metricsRetentionTime) {
                    shouldStop = true;
                    intervalSize = this.metricsRetentionTime - currentMetricsTotalTime;
                }

                var leadingBlocksColorsNumber = element.hashes.length;
                var leadingBlocksColors = leadingBlocksColorsNumber > 0 ? element.hashes : ['#ffffff'];

                leadingBlocksColors.forEach((leadingBlockColor, index) => {
                    var segmentHeight = nodeMetricsHeight / leadingBlocksColorsNumber;

                    graphics.beginPath();
                    graphics.rect(startX + (this.metricsRetentionTime - currentMetricsTotalTime - intervalSize) * widthToTimeFactor, startY + (nodeId - 1) * nodeMetricsHeight + index * segmentHeight, intervalSize * widthToTimeFactor, segmentHeight);
                    graphics.fillStyle = leadingBlockColor;
                    graphics.fill();
                })

                lastTimestamp = element.timestamp;
                currentMetricsTotalTime += intervalSize;

                return shouldStop;
            });
        });

        if (settings.showOnlyMetrics) {
            this.drawAxisNames(graphics, startX, startY, height, "Time", "Node");
        }

    }

}

class BlockCreatingMetricsEventHandler extends EventHandler {

    constructor(network, leadingBlocksMetrics) {
        super(network);
        this.leadingBlocksMetrics = leadingBlocksMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        var leadingBlocksTrack = this.leadingBlocksMetrics.get(processingNode.id);
        if (!leadingBlocksTrack) {
            leadingBlocksTrack = new LinkedList();
            this.leadingBlocksMetrics.set(processingNode.id, leadingBlocksTrack);
        }

        if (baton.isBlockAppended) {
            leadingBlocksTrack.push({
                timestamp: this.network.timer.currentTimestamp,
                hashes: baton.currentlyLeadingBlocks.map(leadingBlock => '#' + leadingBlock.blockHash.slice(0, 6))
            });
        }
    }

}

class BlockVeryfingMetricsEventHandler extends EventHandler {

    constructor(network, leadingBlocksMetrics) {
        super(network);
        this.leadingBlocksMetrics = leadingBlocksMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        var leadingBlocksTrack = this.leadingBlocksMetrics.get(processingNode.id);
        if (!leadingBlocksTrack) {
            leadingBlocksTrack = new LinkedList();
            this.leadingBlocksMetrics.set(processingNode.id, leadingBlocksTrack);
        }

        if (baton.isBlockAppended) {
            leadingBlocksTrack.push({
                timestamp: this.network.timer.currentTimestamp,
                hashes: baton.currentlyLeadingBlocks.map(leadingBlock => '#' + leadingBlock.blockHash.slice(0, 6))
            });
        }
    }

}