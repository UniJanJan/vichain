export class Account {

    constructor(wallet) {
        this.wallet = wallet;
        this.accountHistory = new AccountHistory();
    }

}

export class AccountHistory {

    constructor() {
        this.availableBalanceByLeadingBlockHash = new Map();
        this.transactions = [];
        this.uncommittedTransactionsByLeadingBlockHash = new Map();
        this.expiredTransactionsByLeadingBlockHash = new Map();
    }

    getUncommittedTransactions(leadingBlockHash) {
        return this.uncommittedTransactionsByLeadingBlockHash.get(leadingBlockHash.toString());
    }

    getExpiredTransactions(leadingBlockHash) {
        return this.expiredTransactionsByLeadingBlockHash.get(leadingBlockHash.toString());
    }

    addCommittedTransaction(transaction) {
        this.transactions.push(transaction);
    }

    addUncommittedTransaction(transaction) {
        this.transactions.push(transaction);
        this.uncommittedTransactionsByLeadingBlockHash
            .forEach(uncommittedTransactions => uncommittedTransactions.push(transaction));
    }

    addExpiredTransaction(leadingBlockHash, transaction) {
        this.transactions.push(transaction);
        var expiredTransactions = this.getExpiredTransactions(leadingBlockHash);
        if (expiredTransactions) {
            expiredTransactions.push(transaction);
        } else {
            this.expiredTransactionsByLeadingBlockHash.set(leadingBlockHash.toString(), [transaction]);
        }
    }

    commitTransaction(leadingBlockHash, transaction) {
        var uncommittedTransactions = this.getUncommittedTransactions(leadingBlockHash) || [];
        var committedTransactionIndex = uncommittedTransactions.indexOf(transaction);

        if (committedTransactionIndex > -1) {
            uncommittedTransactions.splice(committedTransactionIndex, 1);
        } else {
            throw new Error("Committed transaction is not uncommitted!");
        }
    }

    expireTransaction(leadingBlockHash, transaction) {
        var uncommittedTransactions = this.getUncommittedTransactions(leadingBlockHash) || [];
        var expiredTransactionIndex = uncommittedTransactions.indexOf(transaction);

        if (expiredTransactionIndex > -1) {
            uncommittedTransactions.splice(expiredTransactionIndex, 1);
            this.addExpiredTransaction(leadingBlockHash, transaction);
        } else {
            throw new Error("Expired transaction is not uncommitted!");
        }
    }

    getAvailableBalance(leadingBlockHash) {
        return this.availableBalanceByLeadingBlockHash.get(leadingBlockHash.toString()) || 0;
    }

    setAvailableBalance(leadingBlockHash, availableBalance) {
        return this.availableBalanceByLeadingBlockHash.set(leadingBlockHash.toString(), availableBalance);
    }

    increaseAvailableBalance(amount, leadingBlockHash) {
        if (leadingBlockHash) {
            var currentAvailableBalance = this.getAvailableBalance(leadingBlockHash);
            this.setAvailableBalance(leadingBlockHash, currentAvailableBalance + amount);
        } else {
            this.availableBalanceByLeadingBlockHash
                .forEach((_, leadingBlockHash) => this.increaseAvailableBalance(amount, leadingBlockHash));
        }
    }

    decreaseAvailableBalance(amount, leadingBlockHash) {
        if (leadingBlockHash) {
            var currentAvailableBalance = this.getAvailableBalance(leadingBlockHash);
            this.setAvailableBalance(leadingBlockHash, currentAvailableBalance - amount);
        } else {
            this.availableBalanceByLeadingBlockHash
                .forEach((_, leadingBlockHash) => this.decreaseAvailableBalance(amount, leadingBlockHash));
        }
    }

    isTransactionUncommitted(leadingBlockHash, transaction) {
        return this.getUncommittedTransactions(leadingBlockHash).includes(transaction);
    }

    isTransactionExpired(leadingBlockHash, transaction) {
        return this.getExpiredTransactions(leadingBlockHash).includes(transaction);
    }

    isTransactionCommitted(leadingBlockHash, transaction) {
        return !this.isTransactionUncommitted(leadingBlockHash, transaction)
            && !this.isTransactionExpired(leadingBlockHash, transaction);
    }
}
