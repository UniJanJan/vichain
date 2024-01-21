export class Settings {

    constructor(specificSettings, defaultSettings) {
        this.specificSettings = specificSettings;
        this.defaultSettings = defaultSettings;

        Object.keys(this.specificSettings).forEach(key => {

            Object.defineProperty(this, key, {
                get: function () {
                    return this.specificSettings[key] === null ? this.defaultSettings[key] : this.specificSettings[key];
                },
                set: function (value) {
                    this.specificSettings[key] = value;
                }
            });

        })
    }

}