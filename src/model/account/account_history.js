export const AccountHistoryTransactionStatus = {
    UNCOMMITTED: 0,
    COMMITTED: 1,
    EXPIRED: 2
}

export class AccountHistory {

    constructor() {
        this.availableBalanceByLeadingBlockHash = new Map();
        this.transactions = [];
        this.transactionsByHash = new Map();
        this.statusMaps = new Map();
    }

    getTransactionsWithStatus(leadingBlockHash, status) {
        var transactionsStatusMap = this.statusMaps.get(leadingBlockHash);
        if (!transactionsStatusMap) {
            transactionsStatusMap = new Map([
                [AccountHistoryTransactionStatus.UNCOMMITTED, new Set()],
                [AccountHistoryTransactionStatus.COMMITTED, new Set()],
                [AccountHistoryTransactionStatus.EXPIRED, new Set()]
            ])
            this.statusMaps.set(leadingBlockHash, transactionsStatusMap);
        }
        return transactionsStatusMap.get(status);
    }

    getCommittedTransactionsHashes(leadingBlockHash) {
        return this.getTransactionsWithStatus(leadingBlockHash, AccountHistoryTransactionStatus.COMMITTED);
    }

    getUncommittedTransactionsHashes(leadingBlockHash) {
        return this.getTransactionsWithStatus(leadingBlockHash, AccountHistoryTransactionStatus.UNCOMMITTED);
    }

    getExpiredTransactionsHashes(leadingBlockHash) {
        return this.getTransactionsWithStatus(leadingBlockHash, AccountHistoryTransactionStatus.EXPIRED);
    }

    getUncommittedTransactions(leadingBlockHash) {
        return [...this.getUncommittedTransactionsHashes(leadingBlockHash)]
            .map(transactionHash => this.transactionsByHash.get(transactionHash));
    }

    addTransactionWithStatus(transaction, leadingBlockHash, status) {
        var transactionHash = transaction.transactionHash;

        if (!this.transactionsByHash.has(transactionHash)) {
            this.transactions.push(transaction);
            this.transactionsByHash.set(transactionHash, transaction);
        }

        this.getTransactionsWithStatus(leadingBlockHash, status).add(transactionHash);
    }

    addCommittedTransaction(transaction, leadingBlockHash) {
        this.addTransactionWithStatus(transaction, leadingBlockHash, AccountHistoryTransactionStatus.COMMITTED);
    }

    addUncommittedTransaction(transaction, leadingBlockHash) {
        if (leadingBlockHash) {
            this.addTransactionWithStatus(transaction, leadingBlockHash, AccountHistoryTransactionStatus.UNCOMMITTED);
        } else {
            this.statusMaps.forEach((_, leadingBlockHash) => this.addUncommittedTransaction(transaction, leadingBlockHash));
        }
    }

    addExpiredTransaction(transaction, leadingBlockHash) {
        this.addTransactionWithStatus(transaction, leadingBlockHash, AccountHistoryTransactionStatus.EXPIRED);
    }

    changeTransactionStatus(transactionHash, leadingBlockHash, sourceStatus, targetStatus) {
        var sourceStatusTransactions = this.getTransactionsWithStatus(leadingBlockHash, sourceStatus);

        if (sourceStatusTransactions.has(transactionHash)) {
            sourceStatusTransactions.delete(transactionHash);
            var targetStatusTransactions = this.getTransactionsWithStatus(leadingBlockHash, targetStatus);
            targetStatusTransactions.add(transactionHash);
        } else {
            throw new Error('Error during transaction status changing!');
        }
    }

    commitTransaction(transactionHash, leadingBlockHash) {
        this.changeTransactionStatus(transactionHash, leadingBlockHash, AccountHistoryTransactionStatus.UNCOMMITTED, AccountHistoryTransactionStatus.COMMITTED);
    }

    expireTransaction(transactionHash, leadingBlockHash) {
        this.changeTransactionStatus(transactionHash, leadingBlockHash, AccountHistoryTransactionStatus.UNCOMMITTED, AccountHistoryTransactionStatus.EXPIRED);
    }

    getAvailableBalance(leadingBlockHash) {
        return this.availableBalanceByLeadingBlockHash.get(leadingBlockHash) || 0;
    }

    setAvailableBalance(leadingBlockHash, availableBalance) {
        return this.availableBalanceByLeadingBlockHash.set(leadingBlockHash, availableBalance);
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

    hasTransactionStatus(transactionHash, leadingBlockHash, status) {
        return this.getTransactionsWithStatus(leadingBlockHash, status).has(transactionHash);
    }

    isTransactionUncommitted(transactionHash, leadingBlockHash) {
        return this.hasTransactionStatus(transactionHash, leadingBlockHash, AccountHistoryTransactionStatus.UNCOMMITTED);
    }

    isTransactionExpired(transactionHash, leadingBlockHash) {
        return this.hasTransactionStatus(transactionHash, leadingBlockHash, AccountHistoryTransactionStatus.EXPIRED);
    }

    isTransactionCommitted(transactionHash, leadingBlockHash) {
        return this.hasTransactionStatus(transactionHash, leadingBlockHash, AccountHistoryTransactionStatus.COMMITTED);
    }
}
