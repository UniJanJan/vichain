import { NetworkManager } from './network_manager.js';

const { createApp, ref } = Vue

const app = createApp({
    data() {
        return {
            networkManager: ref(new NetworkManager()),
            translations: {
                'MessageSendingEvent': 'Message sending',
                'MessageReceivingEvent': 'Message receiving',
                'TransactionCreatingEvent': 'Transaction creation',
                'TransactionVerifyingEvent': 'Transaction verification',
                'WaitingEvent': 'Waiting for '
            }
        }
    },
    computed: {
        selectedNode() {
            return Promise(() => this.networkManager.selectedNode);
        },
        processableEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventManager.eventProcessors.get(this.networkManager.selectedNode).processableEvents : [];
        },
        processingEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventManager.eventProcessors.get(this.networkManager.selectedNode).processingEvents : [];
        },
        processedEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventManager.eventProcessors.get(this.networkManager.selectedNode).processedEvents : [];
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
        }
    }
});

app.mount('#app');

export { app };