import { NetworkManager } from './network_manager.js';

const { createApp, ref } = Vue

const app = createApp({
    data() {
        return {
            networkManager: ref(new NetworkManager()),
            postTransactionRequest: this.getClearPostTransactionRequest(),
            translations: {
                'MessageSendingEvent': 'Message sending',
                'MessageReceivingEvent': 'Message receiving',
                'TransactionCreatingEvent': 'Transaction creation',
                'TransactionVerifyingEvent': 'Transaction verification',
                'BlockVerifyingEvent': 'Block verification',
                'BlockCreatingEvent': 'Block mining',
                'WaitingEvent': 'Waiting for '
            }
        }
    },
    computed: {
        selectedNode() {
            return Promise(() => this.networkManager.selectedNode);
        },
        processableEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventManager.eventProcessors.get(this.networkManager.selectedNode).processableEvents.toArray() : [];
        },
        processingEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventManager.eventProcessors.get(this.networkManager.selectedNode).processingEvents : [];
        },
        processedEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventManager.eventProcessors.get(this.networkManager.selectedNode).processedEvents : [];
        },
        managedAccounts() {
            return this.networkManager.selectedNode ? Array.from(this.networkManager.selectedNode.managedAccounts.accounts.values()) : [];
        },
        pooledTransactions() {
            return this.networkManager.selectedNode ? this.networkManager.selectedNode.transactionPool.transactions : [];
        },
        leadingBlocks() {
            return this.networkManager.selectedNode ? this.networkManager.selectedNode.blockchain.leadingBlocks : [];
        }
    },
    methods: {
        getTranslation(text) {
            return this.translations[text];
        },
        translateEventClassName(event) {
            return this.getTranslation(event.constructor.name) + (event.name || '');
        },
        createRandomNode() {
            if (this.networkManager.canvas) {
                const randomValues = new Uint32Array(2);
                window.crypto.getRandomValues(randomValues);
                var randomX = randomValues[0];
                var randomY = randomValues[1];
                var x = randomX % (this.networkManager.canvas.width - 40) + 20;
                var y = randomY % (this.networkManager.canvas.height - 40) + 20;
                this.networkManager.addNode(x, y);
            }
        },
        installBlockchain() {
            this.networkManager.installBlockchain();
        },
        postTransaction() {
            this.networkManager.postTransaction(this.postTransactionRequest);
            this.postTransactionRequest = this.getClearPostTransactionRequest();
        },
        getClearPostTransactionRequest() {
            return {
                sourceAddres: '',
                sourceAddresPrivateKey: '',
                targetAddress: '',
                amount: 0
            };
        },
        copyToClipboard(event) {
            navigator.clipboard.writeText(event.target.innerText);
        }
    }
});

app.mount('#app');

export { app };