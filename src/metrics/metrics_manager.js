import { BlocksPropagationTimeMetrics } from "./blocks_propagation_time_metrics.js";
import { LeadingBlocksMetrics } from "./leading_blocks_metrics.js";
import { ProcessingEventsCountMetrics } from "./processing_events_count_metrics.js";
import { TransactionsStateMetrics } from "./transactions_state_metrics.js";

export class MetricsManager {

    constructor(network, eventHandlerDispositor) {
        this.network = network;
        this.eventHandlerDispositor = eventHandlerDispositor;

        this.metrics = new Map([
            [LeadingBlocksMetrics.name, new LeadingBlocksMetrics(this.network, this.eventHandlerDispositor)],
            [ProcessingEventsCountMetrics.name, new ProcessingEventsCountMetrics(this.network, this.eventHandlerDispositor)],
            [BlocksPropagationTimeMetrics.name, new BlocksPropagationTimeMetrics(this.network, this.eventHandlerDispositor)],
            [TransactionsStateMetrics.name, new TransactionsStateMetrics(this.network, this.eventHandlerDispositor)]
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