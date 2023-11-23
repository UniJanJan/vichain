const LinkStatus = {
    VIRTUAL: 0,
    ESTABLISHED: 1
};

const LinkStatusColor = {};
LinkStatusColor[LinkStatus.VIRTUAL] = 'grey';
LinkStatusColor[LinkStatus.ESTABLISHED] = 'red';

class Link {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.status = LinkStatus.VIRTUAL;

        this.node1.linkedNodes[node2] = this;
        this.node2.linkedNodes[node1] = this;

        this.calculateProperties();
    }

    getSecondNode(firstNode) {
        if (firstNode === this.node1) {
            return this.node2;
        } else if (firstNode === this.node2) {
            return this.node1;
        } else {
            throw new Error('getSecondNode: Given node is not part of the link!');
        }
    }

    calculateDistance() {
        this.distance = Utils.distance(this.node1.x, this.node1.y, this.node2.x, this.node2.y);
    }

    calculateWidth() {
        this.width = Utils.linkWidth(this.distance, Math.min(this.node1.radius, this.node2.radius));
    }

    calculateProperties() {
        this.calculateDistance();
        this.calculateWidth();
    }

    draw(graphics) {
        graphics.beginPath();
        graphics.moveTo(this.node1.x, this.node1.y);
        graphics.lineTo(this.node2.x, this.node2.y);
        graphics.strokeStyle = LinkStatusColor[this.status];
        graphics.lineCap = 'round';
        graphics.lineWidth = this.width;
        graphics.stroke();
    }
}