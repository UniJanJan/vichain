import { RSA } from "../../common/rsa.js";
import { Transaction } from "../../model/transaction/transaction.js";
import { TransactionBody } from "../../model/transaction/transaction_body.js";

export class TransactionService {

    constructor(network, node) {
        this.network = network;
        this.node = node;
    }

    createTransaction(sourceAccount, targetAddress, amount) {
        var currentTimestamp = this.network.timer.currentTimestamp;
        var transactionValidityDuration = this.network.settings.transactionValidityDuration;

        var transactionBody = new TransactionBody(sourceAccount.nextTransactionId++, sourceAccount.wallet.publicKey, targetAddress, amount, currentTimestamp, transactionValidityDuration);
        return this.createSignedTransaction(transactionBody, sourceAccount.wallet);
    }

    createBurnTransaction(sourceAccount, amount) {
        var burnAddress = this.network.walletPool.getBurnAddress();
        return this.createTransaction(sourceAccount, burnAddress, amount);
    }

    createAwardTransaction(targetAccount, awardAmount) {
        var currentTimestamp = this.network.timer.currentTimestamp;
        awardAmount = awardAmount || this.network.settings.miningAward;

        var transactionBody = new TransactionBody(targetAccount.nextTransactionId++, null, targetAccount.wallet.publicKey, awardAmount, currentTimestamp, 0);
        return this.createSignedTransaction(transactionBody, targetAccount.wallet);
    }

    createSignedTransaction(transactionBody, signingWallet) {
        var signature = RSA.createSignature(transactionBody, signingWallet.privateKey, signingWallet.publicKey);
        return new Transaction(transactionBody, signature);
    }

    postTransaction(sourceAddress, targetAddress, amount) {

    }

}