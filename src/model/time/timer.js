export class Timer {
    constructor() {
        this.currentTimestamp = 0;
    }

    update(updatedCurrentTimestamp) {
        var elapsedTime = updatedCurrentTimestamp - this.currentTimestamp;
        this.currentTimestamp = updatedCurrentTimestamp;
        return elapsedTime;
    }
}