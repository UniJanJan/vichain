export class Timer {
    constructor() {
        this.currentWindowTimestamp = 0;
        this.currentTimestamp = 0;
        this.runningTime = 0;
    }

    update(updatedCurrentTimestamp, isRunning, simulationSpeed) {
        var elapsedTime = (updatedCurrentTimestamp - this.currentWindowTimestamp) * simulationSpeed;
        this.currentWindowTimestamp = updatedCurrentTimestamp;
        if (isRunning) this.currentTimestamp += elapsedTime;
        return elapsedTime;
    }
}