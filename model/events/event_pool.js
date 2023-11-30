export class EventPool {
    constructor() {
        this.processableEvents = [];
        this.processingEvents = [];
        this.processedEvents = [];
    }
}