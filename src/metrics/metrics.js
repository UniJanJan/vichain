export class Metrics {

    constructor(network) {
        this.network = network;
        this.metricsRetentionTime = 50000;
    }

    collectMetrics(elapsedTime) {
        throw new Error("Metrics not implemented!");
    }
}