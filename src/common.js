export class Utils {
    static distance = function (x1, y1, x2, y2) {
        return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
    }

    static linkWidth = function (distance, maxWidth) {
        distance = 1000 / distance;
        // const maxWidth = 0.75 * Math.min(this.node1.radius, this.node2.radius);
        maxWidth = 0.75 * maxWidth;
        return Math.min(Math.max(1, distance), maxWidth);
    }
}