export class IntervalMap {
    constructor(intervalMap) {
        if (intervalMap) {
            this.intervals = [...intervalMap.intervals];
            this.summedInvervalsSize = intervalMap.summedInvervalsSize;
            this.summaryMap = new Map(intervalMap.summaryMap);
        } else {
            this.intervals = [];
            this.summedInvervalsSize = 0;
            this.summaryMap = new Map();
        }
    }

    /* intervalSize should be natural number */
    push(intervalSize, object) {
        var lastInterval = this.intervals.at(-1);
        if (lastInterval && _.isEqual(lastInterval.object, object)) {
            lastInterval.extend(intervalSize);
        } else {
            this.intervals.push(new Interval(this.summedInvervalsSize, intervalSize, object));
        }

        this.summedInvervalsSize += intervalSize;
        var keySummedInvervalsSize = this.summaryMap.get(object) || 0;
        this.summaryMap.set(object, keySummedInvervalsSize + intervalSize);
    }

    get(n) {
        if (n >= this.summedInvervalsSize) {
            throw new Error("IntervalMap: Number out of map bound!");
        }

        for (var interval of this.intervals) {
            if (n >= interval.start && n < interval.end) {
                return interval.object;
            }
        }
    }

    getObjectIntervalsSize(object) {
        return this.summaryMap.get(object);
    }

    getIntervals() {
        return this.intervals;
    }
}

class Interval {
    constructor(start, size, object) {
        this.start = start;
        this.size = size;
        this.end = start + size;
        this.object = object;
    }

    extend(extensionSize) {
        this.end += extensionSize;
        this.size += extensionSize;
    }

}