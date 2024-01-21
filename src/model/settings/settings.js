export class Settings {

    constructor(specificSettings, globalSettings) {
        this.specificSettings = specificSettings;
        this.globalSettings = globalSettings;

        Object.keys(this.specificSettings).forEach(key => {

            Object.defineProperty(this, key, {
                get: function () {
                    return this.specificSettings[key] === null ? this.globalSettings[key] : this.specificSettings[key];
                },
                set: function (value) {
                    this.specificSettings[key] = value;
                }
            });

        })
    }

    setToGlobal() {
        Object.keys(this.specificSettings).forEach(key => {
            this[key] = null;
        });
    }

}