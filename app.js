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
            return this.networkManager.selectedNode ? this.networkManager.eventMaster.eventProcessors.get(this.networkManager.selectedNode).processableEvents : [];
        },
        processingEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventMaster.eventProcessors.get(this.networkManager.selectedNode).processingEvents : [];
        },
        processedEvents() {
            return this.networkManager.selectedNode ? this.networkManager.eventMaster.eventProcessors.get(this.networkManager.selectedNode).processedEvents : [];
        },
        pooledTransactions() {
            return this.networkManager.selectedNode ? this.networkManager.selectedNode.transactionPool.transactions : [];
        }
    },
    methods: {
        getTranslation(text) {
            return this.translations[text];
        },
        translateEventClassName(event) {
            return this.getTranslation(event.constructor.name) + (event.name || '');
        }
    }
});

app.mount('#app');

export { app };