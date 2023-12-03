import { Wallet } from "./wallet.js";

export class WalletPool {
    constructor(poolSize) {
        this.walletPool = [...Array(poolSize).keys()].map(i => Wallet.random());
        this.nextFreeWalletIndex = 0;
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
        return this.walletPool.map(wallet => wallet.publicKey);
    }
}