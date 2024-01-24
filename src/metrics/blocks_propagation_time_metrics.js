import { EventHandler } from "../logic/handler/event_handler.js";
import { BlockCreatingEvent } from "../model/event/block_creating_event.js";
import { BlockVerifyingEvent } from "../model/event/block_verifying_event.js";
import { Metrics } from "./metrics.js";

export class BlocksPropagationTimeMetrics extends Metrics {

    constructor(network, eventHandlerDispositor) {
        super(network, eventHandlerDispositor);

        this.propagatedBlocksMetrics = [];
        this.blockTrack = new Map();

        eventHandlerDispositor.registerEventHandler(Node.name, BlockCreatingEvent.name, new BlockCreatingMetricsEventHandler(this.network, this.blockTrack, this.propagatedBlocksMetrics));
        eventHandlerDispositor.registerEventHandler(Node.name, BlockVerifyingEvent.name, new BlockVeryfingMetricsEventHandler(this.network, this.blockTrack, this.propagatedBlocksMetrics));

        this.maxValue = 10000;
    }

    collectMetrics(elapsedTime) {
        // collected by additional handlers above
    }

    draw(graphics, startX, startY, width, height) {
        // var widthToTimeFactor = width / this.metricsRetentionTime;
        var spaceWidth = width / (this.propagatedBlocksMetrics.length + 1);
        var heightToMaxValue = height / this.maxValue;

        this.propagatedBlocksMetrics.forEach((currentMetrics, index) => {
            if (Math.ceil(currentMetrics.propagationTime * 1.1) > this.maxValue) {
                this.maxValue = Math.ceil(currentMetrics.propagationTime * 1.1);
            }

            graphics.beginPath();
            graphics.moveTo(startX + spaceWidth * (index + 1), startY + height - heightToMaxValue * currentMetrics.propagationTime);
            graphics.arc(startX + spaceWidth * (index + 1), startY + height - heightToMaxValue * currentMetrics.propagationTime, 3, -Math.PI / 2, 3 / 2 * Math.PI, false);
            graphics.fillStyle = '#' + currentMetrics.blockHash.slice(0, 6);
            graphics.fill();
        });

        this.drawInterval(graphics, startX, startY, width, height, Math.ceil(this.maxValue / 2));
        this.drawInterval(graphics, startX, startY, width, height, Math.ceil(this.maxValue / 4));
        this.drawInterval(graphics, startX, startY, width, height, Math.ceil(3 * this.maxValue / 4));
    }

    drawInterval(graphics, startX, startY, width, height, value) {
        var heightToMaxValue = height / this.maxValue;
        var y = startY + height - value * heightToMaxValue;
        graphics.beginPath();
        graphics.moveTo(startX, y);
        graphics.lineTo(startX + 5, y);
        graphics.strokeStyle = 'blue';
        graphics.stroke();

        graphics.fillStyle = 'blue';
        graphics.font = "12px arial";
        graphics.fillText(value, startX + 10, y + 3);

        graphics.beginPath();
        graphics.setLineDash([3, 6]);
        graphics.moveTo(startX + 50, y);
        graphics.lineTo(startX + width, y);
        graphics.strokeStyle = 'blue';
        graphics.stroke();
        graphics.setLineDash([]);
    }

}

class BlockCreatingMetricsEventHandler extends EventHandler {

    constructor(network, blockTrack, propagatedBlocksMetrics) {
        super(network);
        this.blockTrack = blockTrack;
        this.propagatedBlocksMetrics = propagatedBlocksMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        if (baton.createdBlock) {
            var propagationTrack = {
                verifiedBy: new Set([processingNode.id]),
                creationTimestamp: baton.createdBlock.blockBody.creationTimestamp,
                propagationCompletionTimestamp: null
            };

            this.blockTrack.set(baton.createdBlock.blockHash, propagationTrack);

            if (propagationTrack.propagationCompletionTimestamp === null && propagationTrack.verifiedBy.size === this.network.nodes.length) {
                propagationTrack.propagationCompletionTimestamp = this.network.timer.currentTimestamp;
                this.propagatedBlocksMetrics.push({
                    blockHash: baton.verifiedBlock.blockHash,
                    propagationTime: propagationTrack.propagationCompletionTimestamp - propagationTrack.creationTimestamp
                })
                this.blockTrack.delete(baton.verifiedBlock.blockHash);
            }
        }
    }

}

class BlockVeryfingMetricsEventHandler extends EventHandler {

    constructor(network, blockTrack, propagatedBlocksMetrics) {
        super(network);
        this.blockTrack = blockTrack;
        this.propagatedBlocksMetrics = propagatedBlocksMetrics;
    }

    handle(processingNode, processedEvent, baton) {
        if (baton.verifiedBlock) {
            var propagationTrack = this.blockTrack.get(baton.verifiedBlock.blockHash);
            if (propagationTrack) {
                propagationTrack.verifiedBy.add(processingNode.id);

                if (propagationTrack.propagationCompletionTimestamp === null && propagationTrack.verifiedBy.size === this.network.nodes.length) {
                    propagationTrack.propagationCompletionTimestamp = this.network.timer.currentTimestamp;
                    this.propagatedBlocksMetrics.push({
                        blockHash: baton.verifiedBlock.blockHash,
                        propagationTime: propagationTrack.propagationCompletionTimestamp - propagationTrack.creationTimestamp
                    })
                    this.blockTrack.delete(baton.verifiedBlock.blockHash);
                }

            }
        }
    }

}