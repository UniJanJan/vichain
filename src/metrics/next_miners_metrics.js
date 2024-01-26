import { Metrics } from "./metrics.js";

export class NextMinersMetrics extends Metrics {

    constructor(network, eventHandlerDispositor) {
        super(network, eventHandlerDispositor);

        this.nextMinersByLeadingBlock = new Map();

        this.lastRoundNumber = 0;
    }

    collectMetrics(elapsedTime) {
        var roundNumber = Math.ceil(this.network.timer.currentTimestamp / this.network.settings.roundTime);
        if (roundNumber > this.lastRoundNumber) {
            var nextMinersByLeadingBlock = new Map();
            this.network.nodes
                .flatMap(node => node.blockchain.leadingBlocks)
                .forEach(leadingBlock => {
                    if (!nextMinersByLeadingBlock.has(leadingBlock.block.blockHash)) {
                        nextMinersByLeadingBlock.set(leadingBlock.block.blockHash, leadingBlock.nextRoundMiners);
                    }
                });

            this.nextMinersByLeadingBlock = nextMinersByLeadingBlock;
            this.lastRoundNumber = roundNumber;
        }
    }

    draw(graphics, startX, startY, width, height) {
        if (this.nextMinersByLeadingBlock.size === 0) {
            return;
        }

        var rowHeight = height / this.nextMinersByLeadingBlock.size;
        var widthToRoundTime = width / this.network.settings.roundTime;

        Array.from(this.nextMinersByLeadingBlock.entries()).forEach((entry, index) => {
            var blockHash = entry[0];
            var nextMiners = entry[1];

            nextMiners.forEach(miner => {
                var minerAddress = miner.object;

                graphics.beginPath();
                graphics.rect(startX + miner.start * widthToRoundTime, startY + index * rowHeight, miner.size * widthToRoundTime, rowHeight);
                graphics.fillStyle = '#' + minerAddress.slice(0, 6);
                graphics.fill();
            })

            graphics.beginPath();
            graphics.rect(startX, startY + index * rowHeight, width, rowHeight);
            graphics.lineWidth = 8;
            graphics.strokeStyle = '#' + blockHash.slice(0, 6);
            graphics.stroke();
        });

    }

}
