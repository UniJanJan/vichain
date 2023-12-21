import { LinkedList } from "./linked_list.js";

export class IntervalMap {

    constructor(keepSummaryMap = true, retentionSize) {
        this.intervals = new LinkedList();
        this.summedInvervalsSize = 0;
        this.keepSummaryMap = keepSummaryMap;
        this.summaryMap = new Map();
        this.retentionSize = retentionSize;
    }

    clone() {
        var newIntervalMap = new IntervalMap(this.retentionSize, this.retentionSize);
        newIntervalMap.intervals = this.intervals.clone();
        newIntervalMap.summedInvervalsSize = this.summedInvervalsSize;
        newIntervalMap.summaryMap = new Map(this.summaryMap);
        return newIntervalMap;
    }

    /* intervalSize should be natural number */
    push(intervalSize, object) {
        if (this.intervals.isNotEmpty()) {
            var lastInterval = this.intervals.getLastElement().object;
            if (lastInterval && _.isEqual(lastInterval.object, object)) {
                lastInterval.extend(intervalSize);
            } else {
                this.intervals.push(new Interval(this.summedInvervalsSize, intervalSize, object));
            }
        } else {
            this.intervals.push(new Interval(this.summedInvervalsSize, intervalSize, object));
        }

        this.summedInvervalsSize += intervalSize;

        if (this.keepSummaryMap) {
            var keySummedInvervalsSize = this.summaryMap.get(object) || 0;
            this.summaryMap.set(object, keySummedInvervalsSize + intervalSize);
        }

        if (this.retentionSize && 2 * this.retentionSize < this.summedInvervalsSize) {
            var cutSize = this.summedInvervalsSize - this.retentionSize;
            this.cut(cutSize);
            this.summedInvervalsSize -= cutSize;
        }
    }

    cut(cutSize) {
        var remainingCutSize = cutSize;

        var iterator = this.intervals.getProgressiveIterator();
        while (iterator.isElementPresent()) {
            var interval = iterator.getElement();
            if (interval.size <= remainingCutSize) {
                remainingCutSize -= interval.size;
                if (this.keepSummaryMap) {
                    // var keySummedInvervalsSize = this.summaryMap.get(interval.object) || 0;
                    // this.summaryMap.set(interval.object, keySummedInvervalsSize + interval.size);
                }
                iterator.toNextElement();
            } else {
                interval.cut(remainingCutSize);
                if (this.keepSummaryMap) {
                    // var keySummedInvervalsSize = this.summaryMap.get(interval.object) || 0;
                    // this.summaryMap.set(interval.object, keySummedInvervalsSize - remainingCutSize);
                }
                iterator.cutToHere();
                return;
            }
        }
    }

    get(n) {
        if (n >= this.summedInvervalsSize) {
            throw new Error("IntervalMap: Number out of map bound!");
        }

        var iterator = this.intervals.getProgressiveIterator();
        while (iterator.isElementPresent()) {
            var interval = iterator.getElement();
            if (n >= interval.start && n < interval.end) {
                return interval.object;
            } else {
                iterator.toNextElement();
            }
        }

        return undefined;
    }

    getObjectIntervalsSize(object) {
        return this.summaryMap.get(object);
    }

    getIntervals() {
        return this.intervals;
    }

    forEach(fn) {
        var summedInvervalsSize = 0;
        this.intervals.forEach(interval => {
            var shouldStop = fn(interval, summedInvervalsSize);
            summedInvervalsSize += interval.size;
            return shouldStop;
        });
    }

    forEachReversed(fn) {
        var summedInvervalsSize = 0;
        this.intervals.forEachReversed(interval => {
            var shouldStop = fn(interval, summedInvervalsSize);
            summedInvervalsSize += interval.size;
            return shouldStop;
        });
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

    cut(cutSize) {
        this.start += cutSize;
        this.size -= cutSize;
    }

}