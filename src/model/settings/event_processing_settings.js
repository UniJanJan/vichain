import { Settings } from "./settings.js";

export class EventProcessingSettings extends Settings {

    constructor(globalSettings) {
        super({
            maxLoad: null,
            maxEventsBufferLength: null,
            processingPower: null
        }, globalSettings);
    }

}