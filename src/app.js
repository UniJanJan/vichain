import { NetworkManager } from './network_manager.js';

const { createApp, ref } = Vue

const app = createApp({
    data() {
        return {
            networkManager: ref(new NetworkManager()),
            postTransactionRequest: this.getClearPostTransactionRequest(),
            randomNodesToCreateNumber: 1,
            translations: {
                'MessageSendingEvent': 'Message sending',
                'MessageReceivingEvent': 'Message receiving',
                'TransactionCreatingEvent': 'Transaction creation',
                'TransactionVerifyingEvent': 'Transaction verification',
                'BlockVerifyingEvent': 'Block verification',
                'BlockCreatingEvent': 'Block mining',
                'WaitingEvent': 'Waiting for ',

                'peers_discovery': 'peers discovery',
                'transactions_discovery': 'transactions discovery',
                'transaction_generation': 'transaction generation',
                'miners_selection': 'next miner check',

                'AddrMessage': 'peers list',
                'BlockMessage': 'new block',
                'GetBlocksMessage': 'blocks list',
                'GetBlocksResponseMessage': 'request for blocks list',
                'GetTransactionsMessage': 'request for mempooled transactions',
                'GetTransactionsResponseMessage': 'mempooled transactions',
                'GetAddrMessage': 'request for peers list',
                'RejectMessage': 'connection rejection',
                'TrxMessage': 'new transaction',
                'VerAckMessage': 'handshake approval',
                'VersionMessage': 'handshake info',

                'LeadingBlocksMetrics': 'Leading blocks',
                'ProcessingEventsCountMetrics': 'Processing events count'
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
        },
        processedEventsPage() {
            return this.networkManager.processedEventsPage;
        },
        itemsPerPage() {
            return this.networkManager.settings.itemsPerPage;
        }
    },
    methods: {
        getTranslation(text) {
            return this.translations[text];
        },
        translateEventClassName(event) {
            return this.getTranslation(event.constructor.name) + (event.name ? this.getTranslation(event.name) : '');
        },
        createRandomNodes() {
            if (this.networkManager.canvas && Number.isSafeInteger(this.randomNodesToCreateNumber) && this.randomNodesToCreateNumber > 0) {
                this.networkManager.addRandomNodes(this.randomNodesToCreateNumber);
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
        },
        showOnlyMetricsChangeHandler() {
            this.networkManager.unselectNode();
        }
    }
});

app.mount('#app');

export { app };