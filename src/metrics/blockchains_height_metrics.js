import { EventHandler } from "../logic/handler/event_handler.js";
import { BlockCreatingEvent } from "../model/event/block_creating_event.js";
import { BlockVerifyingEvent } from "../model/event/block_verifying_event.js";
import { Metrics } from "./metrics.js";

export class BlockchainsHeightMetrics extends Metrics {

    constructor(network, eventHandlerDispositor) {
        super(network, eventHandlerDispositor);

        this.currentlyLeadingBlocksByNodeId = new Map();
        this.nodesIdsByLeadingBlock = new Map();
        // this.nodesBlockchainsHeight = [];

        eventHandlerDispositor.registerEventHandler(Node.name, BlockCreatingEvent.name, new BlockCreatingMetricsEventHandler(this.network, this.currentlyLeadingBlocksByNodeId, this.nodesIdsByLeadingBlock));
        eventHandlerDispositor.registerEventHandler(Node.name, BlockVerifyingEvent.name, new BlockVeryfingMetricsEventHandler(this.network, this.currentlyLeadingBlocksByNodeId, this.nodesIdsByLeadingBlock));

        this.maxValue = 5;
    }

    collectMetrics(elapsedTime) {
        // collected by additional handlers above
    }

    draw(graphics, startX, startY, width, height) {
        if (this.nodesIdsByLeadingBlock.length === 0) {
            return;
        }

        var columnWidth = width / this.nodesIdsByLeadingBlock.size;
        var heightToMaxValue = height / this.maxValue;

        Array.from(this.nodesIdsByLeadingBlock.entries()).forEach((entry, index) => {
            var blockHash = entry[0];
            var nodesNumber = entry[1].size;

            if (Math.ceil(nodesNumber * 1.1) > this.maxValue) {
                this.maxValue = Math.ceil(nodesNumber * 1.1);
            }

            graphics.beginPath();
            graphics.rect(startX + columnWidth * index, startY + height - nodesNumber * heightToMaxValue, columnWidth, nodesNumber * heightToMaxValue);
            graphics.fillStyle = '#' + blockHash.slice(0, 6);
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

class BlockCreatingMetricsEventHandler extends EventHandler {

    constructor(network, currentlyLeadingBlocksByNodeId, nodesIdsByLeadingBlock) {
        super(network);
        this.currentlyLeadingBlocksByNodeId = currentlyLeadingBlocksByNodeId;
        this.nodesIdsByLeadingBlock = nodesIdsByLeadingBlock;
    }

    handle(processingNode, processedEvent, baton) {
        if (baton.createdBlock && baton.isBlockAppended) {
            var leadingBlocksBefore = this.currentlyLeadingBlocksByNodeId.get(processingNode.id) || [];
            leadingBlocksBefore.forEach(leadingBlock => {
                var nodesIds = this.nodesIdsByLeadingBlock.get(leadingBlock.block.blockHash);
                if (nodesIds) {
                    nodesIds.delete(processingNode.id)
                    if (nodesIds.size === 0) {
                        this.nodesIdsByLeadingBlock.delete(leadingBlock.block.blockHash);
                    }
                }
            });
            this.currentlyLeadingBlocksByNodeId.set(processingNode.id, processingNode.blockchain.leadingBlocks);


            var nodesIds = this.nodesIdsByLeadingBlock.get(baton.createdBlock.blockHash);
            if (!nodesIds) {
                nodesIds = new Set();
                this.nodesIdsByLeadingBlock.set(baton.createdBlock.blockHash, nodesIds);
            }
            nodesIds.add(processingNode.id);
        }
    }

}

class BlockVeryfingMetricsEventHandler extends EventHandler {

    constructor(network, currentlyLeadingBlocksByNodeId, nodesIdsByLeadingBlock) {
        super(network);
        this.currentlyLeadingBlocksByNodeId = currentlyLeadingBlocksByNodeId;
        this.nodesIdsByLeadingBlock = nodesIdsByLeadingBlock;
    }

    handle(processingNode, processedEvent, baton) {
        if (baton.verifiedBlock && baton.isBlockAppended) {
            var leadingBlocksBefore = this.currentlyLeadingBlocksByNodeId.get(processingNode.id) || [];
            leadingBlocksBefore.forEach(leadingBlock => {
                var nodesIds = this.nodesIdsByLeadingBlock.get(leadingBlock.block.blockHash);
                if (nodesIds) {
                    nodesIds.delete(processingNode.id)
                    if (nodesIds.size === 0) {
                        this.nodesIdsByLeadingBlock.delete(leadingBlock.block.blockHash);
                    }
                }
            });
            this.currentlyLeadingBlocksByNodeId.set(processingNode.id, processingNode.blockchain.leadingBlocks);


            var nodesIds = this.nodesIdsByLeadingBlock.get(baton.verifiedBlock.blockHash);
            if (!nodesIds) {
                nodesIds = new Set();
                this.nodesIdsByLeadingBlock.set(baton.verifiedBlock.blockHash, nodesIds);
            }
            nodesIds.add(processingNode.id);
        }
    }

}