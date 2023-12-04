/* file includes code copied from https://github.com/denysdovhan/rsa-labwork/blob/master/index.js (MIT license, Denys Dovhan) [03-12-23] */

export class RSA {
    static e = bigInt(65537);

    static randomPrime(bits) {
        const min = bigInt.one.shiftLeft(bits - 1);
        const max = bigInt.one.shiftLeft(bits).prev();

        while (true) {
            let p = bigInt.randBetween(min, max);
            if (p.isProbablePrime(256)) {
                return p;
            }
        }
    }

    static generate(keysize) {
        let p;
        let q;
        let totient;

        do {
            p = this.randomPrime(keysize / 2);
            q = this.randomPrime(keysize / 2);
            totient = bigInt.lcm(
                p.prev(),
                q.prev()
            );
        } while (bigInt.gcd(RSA.e, totient).notEquals(1) || p.minus(q).abs().shiftRight(keysize / 2 - 100).isZero());

        return {
            e: RSA.e,
            n: p.multiply(q),
            d: RSA.e.modInv(totient),
        };
    }

    static encrypt(encodedMsg, n, e) {
        return bigInt(encodedMsg).modPow(e, n);
    }

    static decrypt(encryptedMsg, d, n) {
        return bigInt(encryptedMsg).modPow(d, n);
    }

    static encode(str) {
        const codes = str
            .split('')
            .map(i => i.charCodeAt())
            .join('');

        return bigInt(codes);
    }

    static decode(code) {
        const stringified = code.toString();
        let string = '';

        for (let i = 0; i < stringified.length; i += 2) {
            let num = Number(stringified.substr(i, 2));

            if (num <= 30) {
                string += String.fromCharCode(Number(stringified.substr(i, 3)));
                i++;
            } else {
                string += String.fromCharCode(num);
            }
        }

        return string;
    }

    static createSignature(data, privateKey, publicKey) {
        var hashedData = CryptoJS.SHA256(JSON.stringify(data)).toString().slice(0, 32);
        var encodedData = RSA.encode(hashedData);
        return RSA.encrypt(encodedData, publicKey, privateKey);
    }

    static verifySignature(data, signature, publicKey) {
        var decryptedData = RSA.decrypt(signature, RSA.e, publicKey);
        var hashedData = CryptoJS.SHA256(JSON.stringify(data)).toString().slice(0, 32);
        var encodedData = RSA.encode(hashedData);
        return encodedData.equals(decryptedData);
    }

}
