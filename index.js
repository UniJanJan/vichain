import { app } from './app.js';
import { Utils } from './common.js';

const canvas = document.querySelector('#visualisation-canvas');

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

new ResizeObserver(() => {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}).observe(canvas);

const graphics = canvas.getContext('2d');

const positionResolver = {
    resolveMousePostion: (event) => {
        return {
            x: event.clientX - canvas.offsetLeft,
            y: event.clientY - canvas.offsetTop
        };
    }
};



const network = app._instance.ctx.network._value;

const linkDraft = {
    isActive: false,
    startNode: null,
    endX: null,
    endY: null,
    draw: (graphics) => {
        if (linkDraft.isActive) {
            graphics.beginPath();
            graphics.lineWidth = Utils.linkWidth(
                Utils.distance(
                    linkDraft.startNode.x, linkDraft.startNode.y,
                    linkDraft.endX, linkDraft.endY),
                linkDraft.startNode.radius);
            graphics.moveTo(linkDraft.startNode.x, linkDraft.startNode.y);
            graphics.lineTo(linkDraft.endX, linkDraft.endY);
            graphics.strokeStyle = 'grey';
            graphics.lineCap = 'round';
            graphics.stroke();
        }
    }
};

var draggedNode = null;

canvas.addEventListener('mousedown', event => {
    const { x, y } = positionResolver.resolveMousePostion(event);

    const node = network.getNode(x, y);

    if (event.shiftKey && node !== null) {
        linkDraft.isActive = true;
        linkDraft.startNode = node;
        linkDraft.endX = x;
        linkDraft.endY = y;
    } else if (event.ctrlKey && node === null) {
        network.addNode(x, y);
    } else if (node !== null) {
        network.setSelectedNode(node);
        draggedNode = node;
    } else if (node === null) {

    }
});

canvas.addEventListener('mousemove', event => {
    if (event.buttons === 1) {
        const { x, y } = positionResolver.resolveMousePostion(event);

        if (linkDraft.isActive && event.shiftKey) {
            linkDraft.endX = x;
            linkDraft.endY = y;
        } else if (draggedNode !== null) {
            draggedNode.updateTargetPoint(x, y);
        }
    }
});

canvas.addEventListener('mouseup', event => {
    if (linkDraft.isActive) {
        linkDraft.isActive = false;
        const endNode = network.getNode(linkDraft.endX, linkDraft.endY);
        if (endNode !== null) {
            network.addLink(linkDraft.startNode, endNode);
        }
    }

    if (draggedNode !== null) {
        draggedNode.abandonTargetPoint();
        draggedNode = null;
    }
});





function simulate(tFrame) {
    window.requestAnimationFrame(simulate);
    graphics.clearRect(0, 0, canvas.width, canvas.height);
    network.update(tFrame);
    linkDraft.draw(graphics);
    network.draw(graphics);
}

simulate();