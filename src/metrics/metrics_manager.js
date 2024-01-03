import { LeadingBlocksMetrics } from "./leading_blocks_metrics.js";
import { ProcessingEventsCountMetrics } from "./processing_events_count_metrics.js";

export class MetricsManager {

    constructor(network) {
        this.network = network;

        this.metrics = new Map([
            [LeadingBlocksMetrics.name, new LeadingBlocksMetrics(this.network)],
            [ProcessingEventsCountMetrics.name, new ProcessingEventsCountMetrics(this.network)]
        ]);
    }

    collectMetrics(elapsedTime) {
        // this.network.nodes.forEach(node =>
        //     this.metrics.forEach(metrics => metrics.collectMetrics(elapsedTime, node))
        // );
        this.metrics.forEach(metrics => metrics.collectMetrics(elapsedTime));
    }

    getMetrics(metrics) {
        return this.metrics.get(metrics);
    }

    getAvailableMetrics() {
        return Array.from(this.metrics.keys());
    }

}