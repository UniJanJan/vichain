export class LinkedList {

    constructor() {
        this.firstElement = null;
        this.lastElement = null;
    }

    clone() {
        var clonedList = new LinkedList();
        this.forEach(object => clonedList.push(object));
        return clonedList;
    }

    push(object) {
        if (this.lastElement === null) {
            var newElement = new LinkedListElement(object, null, null);
            this.lastElement = newElement;
            this.firstElement = newElement;
        } else {
            var newElement = new LinkedListElement(object, this.lastElement, null);
            this.lastElement.nextElement = newElement;
            this.lastElement = newElement;
        }
    }

    shift() {
        if (this.firstElement !== null) {
            var removedObject = this.firstElement.object;
            this.firstElement = this.firstElement.nextElement;
            if (this.firstElement === null) {
                this.lastElement = null;
            } else {
                this.firstElement.previousElement = null;
            }
            return removedObject;
        } else {
            return null;
        }

    }

    getFirstElement() {
        return this.firstElement;
    }

    getLastElement() {
        return this.lastElement;
    }

    isNotEmpty() {
        return this.firstElement !== null;
    }

    forEach(fn) {
        var iterator = this.getProgressiveIterator();
        while (iterator.isElementPresent()) {
            var shouldStop = fn(iterator.getElement());
            if (shouldStop) {
                return;
            } else {
                iterator.toNextElement();
            }
        }
    }

    forEachReversed(fn) {
        var iterator = this.getRegressiveIterator();
        while (iterator.isElementPresent()) {
            var shouldStop = fn(iterator.getElement());
            if (shouldStop) {
                return;
            } else {
                iterator.toPreviousElement();
            }
        }
    }

    getProgressiveIterator() {
        return {
            list: this,
            currentElement: this.firstElement,
            getElement() {
                return this.currentElement.object;
            },
            isElementPresent() {
                return this.currentElement !== null;
            },
            toNextElement() {
                this.currentElement = this.currentElement.nextElement;
            },
            cutToHere() {
                this.currentElement.previousElement = null;
                this.list.firstElement = this.currentElement;
            }
        }
    }

    getRegressiveIterator() {
        return {
            currentElement: this.lastElement,
            getElement() {
                return this.currentElement.object;
            },
            isElementPresent() {
                return this.currentElement !== null;
            },
            toPreviousElement() {
                this.currentElement = this.currentElement.previousElement;
            },
            cutToHere() {
                this.currentElement.nextElement = null;
                this.list.lastElement = this.currentElement;
            }
        }
    }

}

class LinkedListElement {

    constructor(object, previousElement, nextElement) {
        this.object = object;
        this.previousElement = previousElement;
        this.nextElement = nextElement;
    }

}
