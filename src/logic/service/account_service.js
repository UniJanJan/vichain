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
        this.managedAccounts.accounts.set(wallet.publicKey, account);
        return account;
    }

    getManagedAccount(publicKey) {
        return this.managedAccounts.accounts.get(publicKey);
    }

    getRandomManagedAccount() {
        return Utils.getRandomElement(Array.from(this.managedAccounts.accounts.values()));
    }

    getRandomNonManagedAddress() {
        var managedAddresses = Array.from(this.managedAccounts.accounts.keys());
        var nonManagedAddresses = this.walletPool.getAllAddresses()
            .filter(address => !managedAddresses.includes(address));
        return Utils.getRandomElement(nonManagedAddresses);
    }

    updateAvailableBalance(transaction) {
        var managedAccount = this.getManagedAccount(transaction.transactionBody.sourceAddress);
        if (managedAccount) {
            managedAccount.freezeAmount(transaction.transactionHash, transaction.transactionBody.amount, transaction.transactionBody.validTo, transaction.transactionBody.id);
        }
    }

    updateAvailableBalances(leadingBlock) {
        var leadingBlockCreationTimestamp = leadingBlock.block.blockBody.creationTimestamp;

        this.managedAccounts.accounts.forEach(managedAccount => {
            leadingBlock.block.blockBody.transactions.forEach(committedTransaction => {
                if (managedAccount.frozenAmounts.has(committedTransaction.transactionHash)) {
                    managedAccount.frozenAmounts.delete(committedTransaction.transactionHash);
                } else if (managedAccount.wallet.publicKey.toString(16) === committedTransaction.transactionBody.targetAddress.toString(16)) {
                    managedAccount.availableBalance += committedTransaction.transactionBody.amount;
                } else if (committedTransaction.transactionBody.sourceAddress && managedAccount.wallet.publicKey.toString(16) === committedTransaction.transactionBody.sourceAddress.toString(16)) {
                    managedAccount.availableBalance -= committedTransaction.transactionBody.amount;
                }
            });

            var lastTransactionId = this.node.transactionPool.lastTransactionId.get(managedAccount.wallet.publicKey.toString(16));
            managedAccount.frozenAmounts.forEach((frozenAmount, transactionHash) => {
                if (leadingBlockCreationTimestamp > frozenAmount.frozenToTimestamp || lastTransactionId >= frozenAmount.transactionId) {
                    managedAccount.availableBalance += frozenAmount.amount;
                    managedAccount.frozenAmounts.delete(transactionHash);
                    this.node.transactionPool = this.node.transactionPool.transactions.filter(transaction => transaction.transactionHash.toString(16) !== transactionHash)
                }
            })

        });
    }

}