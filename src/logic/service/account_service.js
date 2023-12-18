import { Utils } from "../../common.js";
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
        this.managedAccounts.accounts.set(wallet.publicKey.toString(16), account);
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
            .filter(address => !managedAddresses.includes(address.toString(16)));
        return Utils.getRandomElement(nonManagedAddresses);
    }

    getManagedAccountByTransaction(transaction) {
        var { sourceAddress, targetAddress } = transaction.transactionBody;

        var account = null;
        if (sourceAddress !== null) {
            account = this.getManagedAccount(sourceAddress.toString(16));
        }

        if (!account) {
            account = this.getManagedAccount(targetAddress.toString(16));
        }

        return account;
    }

    addRelatedTransaction(transaction) {
        var managedAccount = this.getManagedAccountByTransaction(transaction);
        if (managedAccount) {
            managedAccount.accountHistory.addUncommittedTransaction(transaction);
            managedAccount.accountHistory.decreaseAvailableBalance(transaction.transactionBody.amount);
        }
    }

    updateRelatedTransactions(leadingBlock) {
        var leadingBlockHash = leadingBlock.block.blockHash.toString();
        var previousBlockHash = leadingBlock.previousBlock ? leadingBlock.previousBlock.block.blockHash.toString() : "0";

        this.managedAccounts.accounts.forEach(managedAccount => {
            var uncommittedTransactions = managedAccount.accountHistory.getUncommittedTransactions(previousBlockHash) || [];
            var expiredTransactions = managedAccount.accountHistory.getExpiredTransactions(previousBlockHash) || [];

            managedAccount.accountHistory.uncommittedTransactionsByLeadingBlockHash.set(leadingBlockHash, [...uncommittedTransactions]);
            managedAccount.accountHistory.expiredTransactionsByLeadingBlockHash.set(leadingBlockHash, [...expiredTransactions]);

            var blockchainBalance = leadingBlock.accountMap.get(managedAccount.wallet.publicKey.toString(16)) || 0;
            managedAccount.accountHistory.setAvailableBalance(leadingBlockHash, blockchainBalance);
        });

        leadingBlock.block.blockBody.transactions.forEach(committedTransaction => {
            var managedAccount = this.getManagedAccountByTransaction(committedTransaction);
            if (managedAccount) {

                var uncommittedRelatedTransaction = _.find(
                    managedAccount.accountHistory.getUncommittedTransactions(leadingBlockHash),
                    relatedTransaction => relatedTransaction.equals(committedTransaction)
                );

                if (uncommittedRelatedTransaction) {
                    managedAccount.accountHistory.commitTransaction(leadingBlockHash, uncommittedRelatedTransaction);
                } else {
                    managedAccount.accountHistory.addCommittedTransaction(committedTransaction);
                }
            }
        });


        var leadingBlockCreationTimestamp = leadingBlock.block.blockBody.creationTimestamp;
        // var remainingBlockHashes = this.node.blockchain.leadingBlocks.map(leadingBlock => leadingBlock.block.blockHash.toString());
        // remainingBlockHashes.push(previousBlockHash);

        this.managedAccounts.accounts.forEach(managedAccount => {

            managedAccount.accountHistory.getUncommittedTransactions(leadingBlockHash).forEach(uncommittedTransaction => {
                var { validTo, amount } = uncommittedTransaction.transactionBody;
                if (validTo < leadingBlockCreationTimestamp) {
                    managedAccount.accountHistory.expireTransaction(uncommittedTransaction);
                    managedAccount.accountHistory.increaseAvailableBalance(amount, leadingBlockHash);
                } else {
                    managedAccount.accountHistory.decreaseAvailableBalance(amount, leadingBlockHash);
                }
            })

        });


    }

}