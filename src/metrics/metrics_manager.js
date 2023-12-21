import { LeadingBlocksMetrics } from "./leading_blocks_metrics.js";

export class MetricsManager {

    constructor(network) {
        this.network = network;

        this.metrics = new Map([
            [LeadingBlocksMetrics.name, new LeadingBlocksMetrics(this.network)]
        ]);
    }

    collectMetrics(elapsedTime) {
        this.metrics.forEach(metrics => metrics.collectMetrics(elapsedTime));
    }

    getMetrics(metrics) {
        return this.metrics.get(metrics);
    }

}