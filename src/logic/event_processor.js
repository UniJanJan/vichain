import { EventStatus } from "../model/event/event.js";

export class EventProcessor {
    constructor(timer, maxLoad, eventPool) {
        this.timer = timer;

        this.maxLoad = maxLoad;
        this.currentLoad = 0;

        this.events = eventPool;
    }

    get processableEvents() {
        return this.events.processableEvents;
    }

    get processingEvents() {
        return this.events.processingEvents;
    }

    get processedEvents() {
        return this.events.processedEvents;
    }

    isEventLoadable(event) {
        return this.currentLoad + event.loadSize <= this.maxLoad;
    }

    enqueueExecution(event) {
        if (event.status === EventStatus.PROCESSABLE) {
            event.enqueuingTimestamp = this.timer.currentTimestamp;
            if (event.loadSize === 0 || event.prioritized) {
                this.processableEvents.unshift(event);
            } else {
                this.processableEvents.push(event);
            }
        } else {
            throw new Error("Event isn't PROCESSABLE. Cannot enqueue its execution!", event);
        }
    }

    startExecution(event) {
        if (event.status === EventStatus.PROCESSABLE && this.isEventLoadable(event)) {
            event.status = EventStatus.PROCESSING;
            this.currentLoad += event.loadSize;
            event.processingStartTimestamp = this.timer.currentTimestamp;
            this.processingEvents.push(event);
        } else {
            throw new Error("Event isn't PROCESSABLE or max load size exceeded. Cannot start its execution!", event);
        }
    }

    /* updates events and returns newly processed events */
    update(elapsedTime) {
        while (this.processableEvents.length > 0 && this.isEventLoadable(this.processableEvents[0])) {
            var processableEvent = this.processableEvents.splice(0, 1)[0];
            this.startExecution(processableEvent);
        }

        var newlyProcessedEvents = [];
        this.processingEvents.forEach((processingEvent, index) => {
            this.updateEvent(processingEvent, elapsedTime);
            if (processingEvent.status === EventStatus.PROCESSED) {
                var processedEvent = this.processingEvents.splice(index, 1)[0];
                this.currentLoad -= processedEvent.loadSize;
                processedEvent.processingEndTimestamp = this.timer.currentTimestamp;
                this.processedEvents.push(processedEvent);
                newlyProcessedEvents.push(processedEvent);
            }
        });

        return newlyProcessedEvents;
    }

    updateEvent(processingEvent, elapsedTime) {
        processingEvent.progress += elapsedTime;
        if (processingEvent.progress >= processingEvent.duration) {
            processingEvent.status = EventStatus.PROCESSED;
        }
    }

}
