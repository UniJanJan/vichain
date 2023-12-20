import { RSA } from "../../common/rsa.js";

export class Wallet {
    constructor(privateKey, publicKey, publicExponent) {
        this.privateKey = privateKey.toString(16);
        this.publicKey = publicKey.toString(16);
        this.publicExponent = publicExponent.toString(16);

        Object.freeze(this);
    }

    static random() {
        const keyPair = RSA.generate(250);
        return new Wallet(keyPair.d, keyPair.n, keyPair.e);
    }

}