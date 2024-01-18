import { IntervalMap } from "../common/interval_map.js";
import { BlockCreatingEvent } from "../model/event/block_creating_event.js";
import { BlockVerifyingEvent } from "../model/event/block_verifying_event.js";
import { Metrics } from "./metrics.js";

export class BlocksPropagationTimeMetrics extends Metrics {

    constructor(network, eventManager) {
        super(network);
        this.eventManager = eventManager;
        this.propagatedBlocksMetrics = [];

        this.blockTrack = new Map();
        this.propagatedBlocks = [];

        this.maxValue = 10000;

        this.eventManager.registerEventHandler(Node.name, BlockCreatingEvent.name, {
            metrics: this,
            handle(processingEntity, processedEvent, baton) {
                var propagationTrack = {
                    verifiedBy: new Set([processingEntity.id]),
                    creationTimestamp: baton.createdBlock.blockBody.creationTimestamp,
                    propagationCompletionTimestamp: null
                };

                this.metrics.blockTrack.set(baton.createdBlock.blockHash, propagationTrack);

                if (propagationTrack.propagationCompletionTimestamp === null && propagationTrack.verifiedBy.size === this.metrics.network.nodes.length) {
                    propagationTrack.propagationCompletionTimestamp = this.metrics.network.timer.currentTimestamp;
                    this.metrics.propagatedBlocksMetrics.push({
                        blockHash: baton.verifiedBlock.blockHash,
                        propagationTime: propagationTrack.propagationCompletionTimestamp - propagationTrack.creationTimestamp
                    })
                    this.metrics.blockTrack.delete(baton.verifiedBlock.blockHash);
                }

                return baton.nextProcessableEvents;
            }
        });

        this.eventManager.registerEventHandler(Node.name, BlockVerifyingEvent.name, {
            metrics: this,
            handle(processingEntity, processedEvent, baton) {
                var propagationTrack = this.metrics.blockTrack.get(baton.verifiedBlock.blockHash);
                if (propagationTrack) {
                    propagationTrack.verifiedBy.add(processingEntity.id);

                    if (propagationTrack.propagationCompletionTimestamp === null && propagationTrack.verifiedBy.size === this.metrics.network.nodes.length) {
                        propagationTrack.propagationCompletionTimestamp = this.metrics.network.timer.currentTimestamp;
                        this.metrics.propagatedBlocksMetrics.push({
                            blockHash: baton.verifiedBlock.blockHash,
                            propagationTime: propagationTrack.propagationCompletionTimestamp - propagationTrack.creationTimestamp
                        })
                        this.metrics.blockTrack.delete(baton.verifiedBlock.blockHash);
                    }

                }
                return baton.nextProcessableEvents;
            }
        });
    }

    collectMetrics(elapsedTime) {
        // collected by additional handlers above
    }

    draw(graphics, startX, startY, width, height) {
        // var widthToTimeFactor = width / this.metricsRetentionTime;
        var spaceWidth = width / (this.propagatedBlocksMetrics.length + 1);
        var heightToMaxValue = height / this.maxValue;

        this.propagatedBlocksMetrics.forEach((currentMetrics, index) => {
            graphics.beginPath();
            graphics.moveTo(startX + spaceWidth * (index + 1), startY + height - heightToMaxValue * currentMetrics.propagationTime);
            graphics.arc(startX + spaceWidth * (index + 1), startY + height - heightToMaxValue * currentMetrics.propagationTime, 3, -Math.PI / 2, 3 / 2 * Math.PI, false);
            graphics.fillStyle = '#' + currentMetrics.blockHash.slice(0, 6);
            graphics.fill();
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