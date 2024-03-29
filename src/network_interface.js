import { Utils } from "./common/common.js";
import { LinkStatus } from "./model/entity/link.js";
const { isProxy, toRaw } = Vue;

export class NetworkInterface {
    constructor(node, network) {
        this.node = node;
        this.network = network;

        this.linkedNodes = {}; // this.linkedNodes = new Map(); ?
        this.linkableNodes = new Set();
    }

    isLinkedWith(node) {
        return this.linkedNodes.hasOwnProperty(node);
    }

    isEstablishedLinkedWith(node) {
        var link = this.getLinkWith(node);
        return link !== undefined && link.status === LinkStatus.ESTABLISHED;
    }

    linkWith(node) {
        this.network.addLink(this.node, node);
    }

    getLinkWith(node) {
        return this.linkedNodes[node];
    }

    getAllLinkedNodes() {
        return Object.values(this.linkedNodes)
            .map(link => link.getSecondNode(this.node));
    }

    getAllEstablishedLinkedNodes() {
        return Object.values(this.linkedNodes)
            .filter(link => link.status === LinkStatus.ESTABLISHED)
            .map(link => link.getSecondNode(this.node));
    }

    getAtLeastHalfEstablishedLinkedNodes() {
        return Object.values(this.linkedNodes)
            .filter(link => link.status === LinkStatus.ESTABLISHED || link.status === LinkStatus.HALF_ESTABLISHED)
            .map(link => link.getSecondNode(this.node));
    }

    getAllLinkableNodes() {
        return [...this.linkableNodes];
    }

    getLinksNumber() {
        return Object.keys(this.linkedNodes).length;
    }

    rememberNodes(nodes) {
        nodes.forEach(this.rememberNode.bind(this));
    }

    rememberNode(node) {
        this.linkableNodes.add(toRaw(node));
    }

    confirmLinkWith(node) {
        var link = this.getLinkWith(node);
        if (link) { //TODO
            link.confirm(this.node);
        }
        // this.linkableNodes.add(node);
    }

    rejectLinkWith(node) {
        var link = this.getLinkWith(node);
        if (link) { //TODO
            link.reject(this.node);

            //temporary (destroy link)
            if (link.status === LinkStatus.VIRTUAL) {
                this.network.links.splice(this.network.links.indexOf(link), 1);
                delete link.node1.networkInterface.linkedNodes[link.node2];
                delete link.node2.networkInterface.linkedNodes[link.node1];
                link.node1 = null;
                link.node2 = null;
            }
        }
    }

    getLinkableNodesSortedByDistance() {
        var linkableNodes = [...this.linkableNodes].filter(nodeTo => nodeTo.id !== this.node.id).map(nodeTo => [nodeTo, Utils.distance(this.node.x, this.node.y, nodeTo.x, nodeTo.y)]);
        linkableNodes.sort((node1, node2) => node1[1] - node2[1]);
        return linkableNodes.map(node => node[0]);
    }

    shouldBePrioritized(node) {
        var nodeIndex = this.getLinkableNodesSortedByDistance().indexOf(node);
        if (nodeIndex >= 0) {
            return nodeIndex < this.node.minLinks; // TODO what if at least one node here has rejected this.node yet?
        } else {
            throw new Error(`${node} is not linkable from ${this.node}!`);
        }
    }

}