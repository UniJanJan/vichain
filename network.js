class Network {
    constructor() {
        this.nodes = [];
        this.links = [];
        // this.eventProcessor = new EventProcessor();
        // this.nodePositionsMap = {};
        this.selectedNode = null;
        this.informativeNodes = [];
    }

    addNode(x, y) {
        var node = new Node(x, y);
        this.nodes.push(node);

        if (this.informativeNodes.length === 0) {
            this.informativeNodes.push(node);
        } else {
            this.informativeNodes.forEach(informativeNode => this.addLink(informativeNode, node));
        }
    }

    addLink(node1, node2) {
        if (!node1.isLinkedWith(node2)) {
            this.links.push(new Link(node1, node2));
            node2.sendMessage(node1, new VersionMessage(node2.version));
        }
    }

    getNode(x, y) {
        for (let index = 0; index < this.nodes.length; index++) {
            const node = this.nodes[index];
            const distance = Utils.distance(node.x, node.y, x, y);
            if (distance <= node.radius) {
                return node;
            }
        }
        return null;
    }

    setSelectedNode(node) {
        if (this.selectedNode !== null)
            this.selectedNode.isSelected = false;
        this.selectedNode = node;
        node.isSelected = true;
    }

    update() {
        this.nodes.forEach(node => node.update());
        this.links.forEach(link => link.update());

        // this.nodes.forEach(node => {
        //     // console.log(Math.random())
        //     if (Object.keys(node.linkedNodes).length > 0 && Math.random() < 0.001) {
        //         Object.values(node.linkedNodes)
        //             .map(link => link.getSecondNode(node))
        //             .forEach(nodeTo => {
        //                 // console.log("Sending message from " + node + " to " + nodeTo);
        //                 this.eventProcessor.sendMessage(node, nodeTo, 'Test message transfer')
        //             });
        //     }
        // });


        // this.eventProcessor.process();
    }

    draw(graphics) {
        this.links.forEach(link => link.draw(graphics));
        // this.eventProcessor.processingEvents.filter(event => !event.drawOnTop).forEach(event => event.draw(graphics));
        this.nodes.forEach(node => node.draw(graphics));
        // this.eventProcessor.processingEvents.filter(event => event.drawOnTop).forEach(event => event.draw(graphics));
    }
}
