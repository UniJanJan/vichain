import { Queue } from "../../common/queue.js";

export class EventPool {

    constructor() {
        this.processableEvents = new Queue();
        this.processingEvents = [];
        this.processedEvents = [];
    }
    
}