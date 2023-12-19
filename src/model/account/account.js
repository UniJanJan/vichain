import { AccountHistory } from "./account_history.js";

export class Account {

    constructor(wallet) {
        this.wallet = wallet;
        this.accountHistory = new AccountHistory();
    }

}
