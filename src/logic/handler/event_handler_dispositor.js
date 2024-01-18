import { EventHandler } from "./event_handler.js";

export class EventHandlerDispositor {

    constructor() {
        this.eventHandlers = new Map();
    }

    registerEventHandler(processingEntityName, eventName, eventHandler) {
        if (!eventHandler instanceof EventHandler) {
            throw new Error("Registered object has to be EventHandler");
        }

        var entityEventHandlers = this.eventHandlers.get(processingEntityName);
        if (!entityEventHandlers) {
            entityEventHandlers = new Map();
            this.eventHandlers.set(processingEntityName, entityEventHandlers);
        }

        var eventHandlers = entityEventHandlers.get(eventName);
        if (!eventHandlers) {
            eventHandlers = [];
            entityEventHandlers.set(eventName, eventHandlers);
        }

        eventHandlers.push(eventHandler);
    }

    getEventHandlers(processingEntityName, eventName) {
        return this.eventHandlers.get(processingEntityName).get(eventName);
    }

}