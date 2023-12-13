export class Account {

    constructor(wallet, availableBalance) {
        this.wallet = wallet;
        this.availableBalance = availableBalance;
        this.nextTransactionId = 1;
        this.frozenAmounts = new Map();
    }

    freezeAmount(key, amount, frozenToTimestamp, transactionId) {
        this.frozenAmounts.set(key, amount, frozenToTimestamp, transactionId);
        this.availableBalance -= amount;
    }

}

export class FrozenAmount {

    constructor(amount, frozenToTimestamp, transactionId) {
        this.amount = amount;
        this.frozenToTimestamp = frozenToTimestamp;
        this.transactionId = transactionId;
    }

}