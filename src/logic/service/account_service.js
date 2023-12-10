import { Utils } from "../../common.js";
import { Account } from "../../model/account/account.js";

export class AccountService {

    constructor(network, node) {
        this.network = network;
        this.node = node;

        this.managedAccounts = this.node.managedAccounts;
        this.blockchain = this.node.blockchain;
        this.walletPool = this.network.walletPool;
    }

    createAccount(wallet) {
        if (!wallet) {
            wallet = this.walletPool.addRandomWallet();
        }

        var account = new Account(wallet, 0);
        this.managedAccounts.accounts.set(wallet.publicKey, account);
        return account;
    }

    getManagedAccount(publicKey) {
        return this.managedAccounts.accounts.get(publicKey);
    }

    getRandomManagedAccount() {
        return Utils.getRandomElement(Array.from(this.managedAccounts.accounts.values()));
    }

    getRandomNonManagedAddress() {
        var managedAddresses = Array.from(this.managedAccounts.accounts.keys());
        var nonManagedAddresses = this.walletPool.getAllAddresses()
            .filter(address => !managedAddresses.includes(address));
        return Utils.getRandomElement(nonManagedAddresses);
    }

}