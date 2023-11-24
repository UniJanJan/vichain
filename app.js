import { Network } from './network.js';

const { createApp, ref } = Vue

const app = createApp({
    data() {
        return {
            network: ref(new Network()),
            eventClassNameTranslation: {
                'MessageSendingEvent': 'Message sending',
                'MessageReceivingEvent': 'Message receiving'
            }
        }
    },
    computed: {
        processableEvents() {
            return this.network.selectedNode ? this.network.selectedNode.eventProcessor.processableEvents : [];
        },
        processingEvents() {
            return this.network.selectedNode ? this.network.selectedNode.eventProcessor.processingEvents : [];
        },
        processedEvents() {
            return this.network.selectedNode ? this.network.selectedNode.eventProcessor.processedEvents : [];
        }
    },
    methods: {
        translateEventClassName(event) {
            return this.eventClassNameTranslation[event.constructor.name];
        }
    }
});

app.mount('#app');

export { app };