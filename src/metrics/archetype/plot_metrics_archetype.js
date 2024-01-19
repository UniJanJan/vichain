import { LinkedList } from "../../common/linked_list.js";

export class PlotMetricsArchetype {

    constructor(startValue = 0) {
        this.metrics = new LinkedList()
        this.metrics.push(new MetricsElement(0, startValue));
    }

    noteMetrics(timestamp, value) {
        this.metrics.push(new MetricsElement(timestamp, value));
    }

    getMetricsLastValue() {
        return this.metrics.getLastElement().value;
    }

}

class MetricsElement {

    constructor(timestamp, value) {
        this.timestamp = timestamp;
        this.value = value;
    }

}