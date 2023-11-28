import { NetworkManager } from './network_manager.js';

const { createApp, ref } = Vue

const app = createApp({
    data() {
        return {
            networkManager: ref(new NetworkManager()),
            eventClassNameTranslation: {
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
            return this.networkManager.selectedNode ? this.networkManager.selectedNode.eventProcessor.processableEvents : [];
        },
        processingEvents() {
            return this.networkManager.selectedNode ? this.networkManager.selectedNode.eventProcessor.processingEvents : [];
        },
        processedEvents() {
            return this.networkManager.selectedNode ? this.networkManager.selectedNode.eventProcessor.processedEvents : [];
        },
        pooledTransactions() {
            return this.networkManager.selectedNode ? this.networkManager.selectedNode.transactionPool.transactions : [];
        }
    },
    methods: {
        translateEventClassName(event) {
            return this.eventClassNameTranslation[event.constructor.name] + (event.name || '');
        }
    }
});

app.mount('#app');

export { app };