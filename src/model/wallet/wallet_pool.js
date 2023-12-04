import { Wallet } from "./wallet.js";

export class WalletPool {
    constructor() {
        this.walletPool = []; //[...Array(poolSize).keys()].map(i => Wallet.random());
        this.nextFreeWalletIndex = 0;
        this.burnAddress = Wallet.random().publicKey;
    }

    addRandomWallet() {
        var newWallet = Wallet.random();
        this.walletPool.push(newWallet);
        return newWallet;
    }

    hasAnyFreeWallet() {
        return this.nextFreeWalletIndex < this.walletPool.length;
    }

    pickFreeWallet() {
        if (this.hasAnyFreeWallet.bind(this)()) {
            return this.walletPool[this.nextFreeWalletIndex++];
        }
    }

    getAllAddresses() {
        return this.walletPool.map(wallet => wallet.publicKey).concat([this.burnAddress]);
    }

    getBurnAddress() {
        return this.burnAddress;
    }
}