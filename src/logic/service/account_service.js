import { Utils } from "../../common/common.js";
import { Account } from "../../model/account/account.js";

export class AccountService {

    constructor(network, node) {
        this.network = network;
        this.node = node;

        this.managedAccounts = this.node.managedAccounts;
        this.blockchain = this.node.blockchain;
        this.walletPool = this.network.walletPool;
    }

    createAccount(wallet) {
        if (!wallet) {
            wallet = this.walletPool.addRandomWallet();
        }

        var account = new Account(wallet, 0);
        this.managedAccounts.accounts.set(wallet.publicKey, account);
        return account;
    }

    getManagedAccount(publicKey) {
        return this.managedAccounts.accounts.get(publicKey);
    }

    getManagedAccounts() {
        return Array.from(this.managedAccounts.accounts.values());
    }

    getRandomManagedAccount() {
        return Utils.getRandomElement(this.getManagedAccounts());
    }

    getRandomNonManagedAddress() {
        var managedAddresses = Array.from(this.managedAccounts.accounts.keys());
        var nonManagedAddresses = this.walletPool.getAllAddresses()
            .filter(address => !managedAddresses.includes(address));
        return Utils.getRandomElement(nonManagedAddresses);
    }

    getSafeAvailableBalance(accountPublicKey) {
        var account = this.getManagedAccount(accountPublicKey);
        if (account) {
            var currentLeadingBlocksAvailableBalances = this.blockchain.leadingBlocks
                .map(leadingBlock => leadingBlock.block.blockHash)
                .map(leadingBlock => account.accountHistory.getAvailableBalance(leadingBlock));

            return Math.min(currentLeadingBlocksAvailableBalances);
        } else {
            return null;
        }
    }

    getManagedAccountByTransaction(transaction) {
        var { sourceAddress, targetAddress } = transaction.transactionBody;

        var account = null;
        if (sourceAddress !== null) {
            account = this.getManagedAccount(sourceAddress);
        }

        if (!account) {
            account = this.getManagedAccount(targetAddress);
        }

        return account;
    }

    addRelatedTransaction(transaction) {
        var managedAccount = this.getManagedAccountByTransaction(transaction);
        if (managedAccount) { // TODO what if transaction is expired here?
            managedAccount.accountHistory.addUncommittedTransaction(transaction);
            if (transaction.transactionBody.sourceAddress === managedAccount.wallet.publicKey) {
                managedAccount.accountHistory.decreaseAvailableBalance(transaction.transactionBody.amount);
            }
        }
    }

    updateRelatedTransactions(leadingBlock) {
        var leadingBlockHash = leadingBlock.block.blockHash;
        var previousBlockHash = leadingBlock.previousBlock ? leadingBlock.previousBlock.block.blockHash : "0";

        this.managedAccounts.accounts.forEach(managedAccount => {
            var uncommittedTransactions = managedAccount.accountHistory.getUncommittedTransactionsHashes(leadingBlockHash);
            var committedTransactions = managedAccount.accountHistory.getCommittedTransactionsHashes(leadingBlockHash);
            var expiredTransactions = managedAccount.accountHistory.getExpiredTransactionsHashes(leadingBlockHash);

            managedAccount.accountHistory.getUncommittedTransactionsHashes(previousBlockHash).forEach(oldHash => uncommittedTransactions.add(oldHash));
            managedAccount.accountHistory.getCommittedTransactionsHashes(previousBlockHash).forEach(oldHash => committedTransactions.add(oldHash));
            managedAccount.accountHistory.getExpiredTransactionsHashes(previousBlockHash).forEach(oldHash => expiredTransactions.add(oldHash));

            var blockchainBalance = leadingBlock.accountMap.get(managedAccount.wallet.publicKey) || 0;
            managedAccount.accountHistory.setAvailableBalance(leadingBlockHash, blockchainBalance);
        });

        leadingBlock.block.blockBody.transactions.forEach(committedTransaction => {
            var managedAccount = this.getManagedAccountByTransaction(committedTransaction);
            if (managedAccount) {
                if (managedAccount.accountHistory.isTransactionUncommitted(committedTransaction.transactionHash, leadingBlockHash)) {
                    managedAccount.accountHistory.commitTransaction(committedTransaction.transactionHash, leadingBlockHash);
                } else {
                    managedAccount.accountHistory.addCommittedTransaction(committedTransaction, leadingBlockHash);
                }
            }
        });


        var leadingBlockCreationTimestamp = leadingBlock.block.blockBody.creationTimestamp;

        this.managedAccounts.accounts.forEach(managedAccount => {

            managedAccount.accountHistory.getUncommittedTransactions(leadingBlockHash).forEach(uncommittedTransaction => {
                var { validTo, amount, sourceAddress } = uncommittedTransaction.transactionBody;
                if (validTo < leadingBlockCreationTimestamp) {
                    managedAccount.accountHistory.expireTransaction(uncommittedTransaction.transactionHash, leadingBlockHash);
                } else if (sourceAddress === managedAccount.wallet.publicKey) {
                    managedAccount.accountHistory.decreaseAvailableBalance(amount, leadingBlockHash);
                }
            })

        });
    }

    dropUnnecessaryAccountHistories() {
        var currentlyLeadingBlocks = this.node.blockchain.leadingBlocks;
        var blockHashesToRemain = new Set(["0"]);
        if (currentlyLeadingBlocks[0].previousBlock) {
            blockHashesToRemain.add(currentlyLeadingBlocks[0].previousBlock.block.blockHash);
        }
        currentlyLeadingBlocks.forEach(leadingBlock => blockHashesToRemain.add(leadingBlock.block.blockHash));
        this.managedAccounts.accounts.forEach(managedAccount => {

            managedAccount.accountHistory.availableBalanceByLeadingBlockHash.forEach((_, leadingBlockHash) => {
                if (!blockHashesToRemain.has(leadingBlockHash)) {
                    managedAccount.accountHistory.availableBalanceByLeadingBlockHash.delete(leadingBlockHash);
                }
            });

            managedAccount.accountHistory.statusMaps.forEach((_, leadingBlockHash) => {
                if (!blockHashesToRemain.has(leadingBlockHash)) {
                    managedAccount.accountHistory.statusMaps.delete(leadingBlockHash);
                }
            });

        });
    }

}