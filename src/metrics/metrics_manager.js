import { BlocksPropagationTimeMetrics } from "./blocks_propagation_time_metrics.js";
import { LeadingBlocksMetrics } from "./leading_blocks_metrics.js";
import { ProcessingEventsCountMetrics } from "./processing_events_count_metrics.js";
import { TransactionsStateMetrics } from "./transactions_state_metrics.js";

export class MetricsManager {

    constructor(network, eventHandlerDispositor) {
        this.network = network;
        this.eventHandlerDispositor = eventHandlerDispositor;

        this.availableMetrics = [
            LeadingBlocksMetrics,
            ProcessingEventsCountMetrics,
            BlocksPropagationTimeMetrics,
            TransactionsStateMetrics
        ];

        this.metrics = new Map(
            this.availableMetrics.map(clazz => [clazz.name, new clazz(this.network, this.eventHandlerDispositor)])
        );
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
        return this.availableMetrics.map(metrics => metrics.name);
    }

}