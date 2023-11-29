export const EventStatus = {
    PROCESSABLE: 0,
    PROCESSING: 1,
    PROCESSED: 2
};

export class Event {
    constructor(duration) {
        this.duration = duration;
        this.progress = 0;
        this.status = EventStatus.PROCESSABLE;
        this.loadSize = 1;

        this.enqueuingTimestamp = null;
        this.processingStartTimestamp = null;
        this.processingEndTimestamp = null;
    }
}
