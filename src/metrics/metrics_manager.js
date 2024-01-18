import { BlocksPropagationTimeMetrics } from "./blocks_propagation_time_metrics.js";
import { LeadingBlocksMetrics } from "./leading_blocks_metrics.js";
import { ProcessingEventsCountMetrics } from "./processing_events_count_metrics.js";

export class MetricsManager {

    constructor(network, eventManager) {
        this.network = network;
        this.eventManager = eventManager;

        this.metrics = new Map([
            [LeadingBlocksMetrics.name, new LeadingBlocksMetrics(this.network)],
            [ProcessingEventsCountMetrics.name, new ProcessingEventsCountMetrics(this.network)],
            [BlocksPropagationTimeMetrics.name, new BlocksPropagationTimeMetrics(this.network, this.eventManager)]
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