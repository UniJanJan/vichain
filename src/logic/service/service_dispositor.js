import { AccountService } from "./account_service.js";
import { TransactionService } from "./transaction_service.js";

export class ServiceDispositor {

    constructor(network) {
        this.network = network;
        this.services = new Map();
    }

    getKey(Service, node) {
        return `${Service.name}-${node}`;
    }

    registerService(Service, node) {
        var service = new Service(this.network, node);
        this.services.set(this.getKey(Service, node), service);
        return service;
    }

    getService(Service, node) {
        return this.services.get(this.getKey(Service, node)) || this.registerService(Service, node);
    }

    getTransactionService(node) {
        return this.getService(TransactionService, node);
    }

    getAccountService(node) {
        return this.getService(AccountService, node);
    }

}