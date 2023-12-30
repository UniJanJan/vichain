export class Queue {

    constructor() {
        this.head = null;
        this.tail = null;
        this.size = 0;
    }

    enqueue(object) {
        var newQueueElement = new QueueElement(object, null);
        if (this.tail === null) {
            this.tail = newQueueElement;
            this.head = newQueueElement;
        } else {
            this.tail.nextElement = newQueueElement;
            this.tail = newQueueElement;
        }
        this.size++;
    }

    enqueueWithPriority(object) {
        var newQueueElement = new QueueElement(object, this.head);
        this.head = newQueueElement;
        if (this.tail === null) {
            this.tail = newQueueElement;
        }
        this.size++;
    }

    isNotEmpty() {
        return this.head !== null;
    }

    check() {
        return this.head === null ? null : this.head.object;
    }

    dequeue() {
        if (this.head === null) {
            return null;
        } else {
            var object = this.head.object;
            this.head = this.head.nextElement;
            if (this.head === null) this.tail = null;
            this.size--;
            return object;
        }
    }

    toArray() {
        var array = [];
        var currentElement = this.head;
        while (currentElement !== null) {
            array.push(currentElement.object);
            currentElement = currentElement.nextElement;
        }
        return array;
    }

}

class QueueElement {

    constructor(object, nextElement) {
        this.object = object;
        this.nextElement = nextElement;
    }

}