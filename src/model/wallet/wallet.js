import { RSA } from "../../common/rsa.js";

export class Wallet {
    constructor(privateKey, publicKey, publicExponent) {
        this.privateKey = privateKey;
        this.publicKey = publicKey;
        this.publicExponent = publicExponent;
        Object.freeze(this);
    }

    static random() {
        const keyPair = RSA.generate(250);
        return new Wallet(keyPair.d, keyPair.n, keyPair.e);
    }

}