export class Metrics {

    constructor(network) {
        this.network = network;
        this.metricsRetentionTime = 50000;
    }

    collectMetrics(elapsedTime) {
        throw new Error("Metrics not implemented!");
    }

    drawAxisNames(graphics, startX, startY, height, xAxisName, yAxisName) {
        graphics.beginPath();
        graphics.moveTo(startX + 10, startY + height - 10);
        graphics.lineTo(startX + 30, startY + height - 10);
        graphics.strokeStyle = 'blue';
        graphics.stroke();

        graphics.fillStyle = 'blue';
        graphics.font = "12px arial";
        graphics.fillText('X: ' + xAxisName, startX + 35, startY + height - 8);


        graphics.beginPath();
        graphics.moveTo(startX + 10, startY + height - 10);
        graphics.lineTo(startX + 10, startY + height - 30);
        graphics.strokeStyle = 'blue';
        graphics.stroke();

        graphics.fillStyle = 'blue';
        graphics.font = "12px arial";
        graphics.fillText('Y: ' + yAxisName, startX + 8, startY + height - 35);
    }
}