class EventProcessor {
    constructor() {
        this.events = [];
    }

    sendMessage(nodeFrom, nodeTo, message) {
        if (nodeFrom.isLinkedWith(nodeTo)) {
            this.events.push(new MessageTransmissionEvent(nodeFrom, nodeTo, message));
            console.log("New event!", this.events);
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
