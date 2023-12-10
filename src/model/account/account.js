export class Account {

    constructor(wallet, availableBalance) {
        this.wallet = wallet;
        this.availableBalance = availableBalance;
        this.nextTransactionId = 1;
    }

}