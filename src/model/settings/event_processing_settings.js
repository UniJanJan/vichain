import { Settings } from "./settings.js";

export class EventProcessingSettings extends Settings {

    constructor(defaultSettings) {
        super({
            maxLoad: null,
            maxEventsBufferLength: null,
            processingPower: null
        }, defaultSettings);
    }

}