import { NetworkManager } from './network_manager.js';

const { createApp, ref, reactive } = Vue

const app = createApp({
    data() {
        var networkManager = new NetworkManager();
        this.networkManager = networkManager;

        networkManager.network.timer = reactive(networkManager.network.timer);
        networkManager.selectedNode = reactive(networkManager.selectedNode);
        networkManager.settings = reactive(networkManager.settings);

        return {
            postTransactionRequest: this.getClearPostTransactionRequest(),
            randomNodesToCreateNumber: 1,
            translations: {
                'MessageSendingEvent': 'Message sending',
                'MessageReceivingEvent': 'Message receiving',
                'MessageTransmissionEvent': 'Message transmission',
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
                'GetBlocksMessage': 'request for blocks list',
                'GetBlocksResponseMessage': 'blocks list',
                'GetTransactionsMessage': 'request for mempooled transactions',
                'GetTransactionsResponseMessage': 'mempooled transactions',
                'GetAddrMessage': 'request for peers list',
                'RejectMessage': 'connection rejection',
                'TrxMessage': 'new transaction',
                'VerAckMessage': 'handshake approval',
                'VersionMessage': 'handshake info',

                'LeadingBlocksMetrics': 'Leading blocks',
                'ProcessingEventsCountMetrics': 'Average processing events count'
            },

            networkSettings: networkManager.network.settings,
            timer: networkManager.network.timer,

            selectedNode: networkManager.selectedNode,
        }
    },
    computed: {
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
        },
        zeroEventDurations() {
            Object.keys(this.networkManager.network.settings.eventsDurations).forEach(event => {
                this.networkManager.network.settings.eventsDurations[event] = 0;
            });

            Object.keys(this.networkManager.network.settings.eventsDurationMultipliers).forEach(event => {
                this.networkManager.network.settings.eventsDurationMultipliers[event] = 0;
            });
        },
        setDefaultEventDurations() {
            this.networkManager.network.settings.eventsDurations = Object.assign({}, this.networkManager.network.settings.defaultEventsDurations);
            this.networkManager.network.settings.eventsDurationMultipliers = Object.assign({}, this.networkManager.network.settings.defaultEventsDurationMultipliers);
        }
    }
});

app.mount('#app');

export { app };