import { EventStatus } from './event.js';

export class EventProcessor {
    constructor(maxLoad, onProcessed) {
        this.maxLoad = maxLoad;
        this.currentLoad = 0;

        this.processableEvents = [];
        this.processingEvents = [];
        this.processedEvents = [];

        // callbacks
        this.onProcessed = onProcessed;
    }

    isEventLoadable(event) {
        return this.currentLoad + event.loadSize <= this.maxLoad;
    }

    enqueueExecution(event) {
        if (event.status === EventStatus.PROCESSABLE) {
            this.processableEvents.push(event);
        } else {
            throw new Error("Event isn't PROCESSABLE. Cannot enqueue its execution!", event);
        }
    }

    startExecution(event) {
        if (event.status === EventStatus.PROCESSABLE && this.isEventLoadable(event)) {
            event.status = EventStatus.PROCESSING;
            this.currentLoad += event.loadSize;
            this.processingEvents.push(event);
        } else {
            throw new Error("Event isn't PROCESSABLE or max load size exceeded. Cannot start its execution!", event);
        }
    }

    update(elapsedTime) {
        while (this.processableEvents.length > 0 && this.isEventLoadable(this.processableEvents[0])) {
            var processableEvent = this.processableEvents.splice(0, 1)[0];
            this.startExecution(processableEvent);
        }

        this.processingEvents.forEach((event, index) => {
            event.update(elapsedTime);
            if (event.status === EventStatus.PROCESSED) {
                var processedEvent = this.processingEvents.splice(index, 1)[0];
                this.currentLoad -= processedEvent.loadSize;
                this.processedEvents.unshift(processedEvent);
                if (this.onProcessed !== null) {
                    this.onProcessed(processedEvent);
                }
            }
        });
    }

}
