class EventProcessor {
    constructor() {
        this.events = [];
    }

    sendMessage(nodeFrom, nodeTo, message) {
        if (nodeFrom.isLinkedWith(nodeTo)) {
            // this.events.push(new MessageSendingEvent(nodeFrom, nodeTo, message));
            nodeFrom.pendingEvents.push(new MessageSendingEvent(nodeFrom, nodeTo, message));
            // console.log("New event sending!", this.events);
        }
    }

    transmitMessage(nodeFrom, nodeTo, message) {
        if (nodeFrom.isLinkedWith(nodeTo)) {
            this.events.push(new MessageTransmissionEvent(nodeFrom, nodeTo, message));
            // console.log("New event transmission!", this.events);
        }
    }

    startExecution(event) {
        if (event.status === EventStatus.PROCESSABLE) {
            event.status = EventStatus.PROCESSING;
            this.events.push(event);
        } else {
            throw new Error("Event is UNPROCESSABLE. Cannot start its execution!", event);
        }
    }

    process() {
        this.events.forEach((event, index) => {
            event.update();
            if (event.status === EventStatus.PROCESSED) {
                this.events.splice(index, 1);
            }
        });
    }

}
