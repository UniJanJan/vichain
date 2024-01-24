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

        var maxMetrics = 0;

        Array.from(this.nodesIdsByLeadingBlock.entries()).forEach((entry, index) => {
            var blockHash = entry[0];
            var nodesNumber = entry[1].nodesIds.size;
            var blockchainHeight = entry[1].blockchainHeight;

            if (Math.ceil(nodesNumber * 1.1) > this.maxValue) {
                this.maxValue = Math.ceil(nodesNumber * 1.1);
            }

            if (maxMetrics < nodesNumber) {
                maxMetrics = nodesNumber;
            }

            var columnHeight = nodesNumber * heightToMaxValue;

            graphics.beginPath();
            graphics.rect(startX + columnWidth * index, startY + height - columnHeight, columnWidth, columnHeight);
            graphics.fillStyle = '#' + blockHash.slice(0, 6);
            graphics.fill();

            var fontSize = (columnHeight > 40) ? 20 : (columnHeight / 2)

            graphics.fillStyle = 'white';
            graphics.font = fontSize + "px arial bold";
            graphics.fillText(blockchainHeight, startX + columnWidth * index + (columnWidth / 2), startY + height - ((columnHeight - fontSize) / 2));
        });

        graphics.beginPath();
        graphics.moveTo(startX, startY + height - maxMetrics * heightToMaxValue);
        graphics.lineTo(startX + 5, startY + height - maxMetrics * heightToMaxValue);
        graphics.strokeStyle = 'blue';
        graphics.stroke();

        graphics.fillStyle = 'blue';
        graphics.font = "12px arial";
        graphics.fillText(maxMetrics, startX + 10, startY + height - maxMetrics * heightToMaxValue + 3);

        graphics.beginPath();
        graphics.setLineDash([3, 6]);
        graphics.moveTo(startX + 30, startY + height - maxMetrics * heightToMaxValue);
        graphics.lineTo(startX + width, startY + height - maxMetrics * heightToMaxValue);
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
                var nodesIdsObject = this.nodesIdsByLeadingBlock.get(leadingBlock.block.blockHash);
                if (nodesIdsObject) {
                    nodesIdsObject.nodesIds.delete(processingNode.id)
                    if (nodesIdsObject.nodesIds.size === 0) {
                        this.nodesIdsByLeadingBlock.delete(leadingBlock.block.blockHash);
                    }
                }
            });
            this.currentlyLeadingBlocksByNodeId.set(processingNode.id, processingNode.blockchain.leadingBlocks);

            baton.currentlyLeadingBlocks.forEach(leadingBlock => {
                var nodesIdsObject = this.nodesIdsByLeadingBlock.get(leadingBlock.blockHash);
                if (!nodesIdsObject) {
                    nodesIdsObject = {
                        nodesIds: new Set(),
                        blockchainHeight: leadingBlock.blockBody.height
                    };
                    this.nodesIdsByLeadingBlock.set(leadingBlock.blockHash, nodesIdsObject);
                }
                nodesIdsObject.nodesIds.add(processingNode.id);
            })
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
                var nodesIdsObject = this.nodesIdsByLeadingBlock.get(leadingBlock.block.blockHash);
                if (nodesIdsObject) {
                    nodesIdsObject.nodesIds.delete(processingNode.id)
                    if (nodesIdsObject.nodesIds.size === 0) {
                        this.nodesIdsByLeadingBlock.delete(leadingBlock.block.blockHash);
                    }
                }
            });
            this.currentlyLeadingBlocksByNodeId.set(processingNode.id, processingNode.blockchain.leadingBlocks);

            baton.currentlyLeadingBlocks.forEach(leadingBlock => {
                var nodesIdsObject = this.nodesIdsByLeadingBlock.get(leadingBlock.blockHash);
                if (!nodesIdsObject) {
                    nodesIdsObject = {
                        nodesIds: new Set(),
                        blockchainHeight: leadingBlock.blockBody.height
                    };
                    this.nodesIdsByLeadingBlock.set(leadingBlock.blockHash, nodesIdsObject);
                }
                nodesIdsObject.nodesIds.add(processingNode.id);
            });
        }
    }

}