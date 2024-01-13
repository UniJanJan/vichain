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

    set processingEvents(events) {
        this.events.processingEvents = events;
    }

    isEventLoadable(event) {
        return this.currentLoad + event.loadSize <= this.maxLoad;
    }

    enqueueExecution(event) {
        if (event.status === EventStatus.PROCESSABLE) {
            event.enqueuingTimestamp = this.timer.currentTimestamp;
            if (event.loadSize === 0 || event.prioritized) {
                this.processableEvents.enqueueWithPriority(event);
            } else {
                this.processableEvents.enqueue(event);
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
        while (this.processableEvents.isNotEmpty() && this.isEventLoadable(this.processableEvents.check())) {
            var processableEvent = this.processableEvents.dequeue();
            this.startExecution(processableEvent);
        }

        var stillProcessingEvents = [];
        var newlyProcessedEvents = [];

        this.processingEvents.forEach(processingEvent => {
            this.updateEvent(processingEvent, elapsedTime);
            if (processingEvent.status === EventStatus.PROCESSED) {
                this.currentLoad -= processingEvent.loadSize;
                processingEvent.processingEndTimestamp = this.timer.currentTimestamp;
                this.processedEvents.push(processingEvent);
                newlyProcessedEvents.push(processingEvent);
            } else {
                stillProcessingEvents.push(processingEvent);
            }
        });

        this.processingEvents = stillProcessingEvents;

        return newlyProcessedEvents;
    }

    updateEvent(processingEvent, elapsedTime) {
        processingEvent.progress += elapsedTime;
        if (processingEvent.progress >= processingEvent.duration) {
            processingEvent.status = EventStatus.PROCESSED;
        }
    }

}
