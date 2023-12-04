export class DiscreteIntervalMap {
    constructor() {
        this.intervals = [];
        this.summedInvervalsSize = 0;
    }

    /* intervalSize should be natural number */
    push(intervalSize, object) {
        this.intervals.push(new DiscreteInterval(this.summedInvervalsSize, intervalSize, object));
        this.summedInvervalsSize += intervalSize;
    }

    get(n) {
        if (n >= this.summedInvervalsSize) {
            throw new Error("DiscreteIntervalMap: Number out of map bound!");
        }

        for (var interval of this.intervals) {
            if (n >= interval.start && n < interval.end) {
                return interval.object;
            }
        }
    }
}

class DiscreteInterval {
    constructor(start, size, object) {
        this.start = start;
        this.size = size;
        this.end = start + size;
        this.object = object;
    }
}