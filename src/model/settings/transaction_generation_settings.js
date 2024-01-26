import { Settings } from "./settings.js";

export class TransactionGenerationSettings extends Settings {

    constructor(globalSettings) {
        var specificSettings = {};
        Object.keys(globalSettings).forEach(key => {
            specificSettings[key] = null;
        });
        super(specificSettings, globalSettings);
    }

}