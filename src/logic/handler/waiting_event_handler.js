import { Utils } from "../../common.js";
import { RSA } from "../../common/rsa.js";
import { CyclicEventsName } from "../../model/event/waiting_event.js";
import { AddrMessage } from "../../model/message/addr_message.js";
import { GetBlocksMessage } from "../../model/message/get_blocks_message.js";
import { GetTransactionsMessage } from "../../model/message/get_transactions_message.js";
import { GetAddrMessage } from "../../model/message/getaddr_message.js";
import { EventHandler } from "./event_handler.js";

export class WaitingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) {
        switch (processedEvent.name) {
            case CyclicEventsName.SENDING_ADDRESS:
                return [
                    this.eventFactory.createMessageBroadcastEvent(processingNode, new AddrMessage(this.networkInterface.getAllLinkableNodes())),
                    this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.SENDING_ADDRESS, 360000)
                ];
            case CyclicEventsName.PEERS_DISCOVERY:
                var waitTime = this.getPeersDiscoveryTimeInterval.bind(this)(processingNode);

                if (processingNode.networkInterface.getAllEstablishedLinkedNodes().length > 0) {
                    return [
                        ...this.eventFactory.createLinksUpdateEvents(this.network, processingNode),
                        this.eventFactory.createMessageBroadcastEvent(processingNode, new GetAddrMessage()),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.PEERS_DISCOVERY, waitTime)
                    ];
                } else {
                    return [
                        ...this.eventFactory.createLinksUpdateEvents(this.network, processingNode),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.PEERS_DISCOVERY, waitTime)
                    ];
                }
            case CyclicEventsName.TRANSACTIONS_DISCOVERY:
                // var waitTime = this.getTimeInterval(this.network.settings.minTransactionsDiscoveryInterval, this.network.settings.avgTransactionsDiscoveryInterval);

                if (processingNode.transactionPool.transactions.length < 3) {
                    return [
                        this.eventFactory.createMessageBroadcastEvent(processingNode, new GetTransactionsMessage()),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTIONS_DISCOVERY, 20000)
                    ]
                } else {
                    return [
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTIONS_DISCOVERY, 10000)
                    ]
                }
            case CyclicEventsName.BLOCKS_DISCOVERY:
                if (processingNode.blockchain.leadingBlocks.length > 0 && processingNode.blockchain.leadingBlocks[0].block.blockBody.height === 0) { // TODO
                    return [
                        this.eventFactory.createMessageBroadcastEvent(processingNode, new GetBlocksMessage()),
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.BLOCKS_DISCOVERY, 20000)
                    ]
                } else {
                    return [
                        this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.BLOCKS_DISCOVERY, 10000)
                    ]
                }
            case CyclicEventsName.TRANSACTION_GENERATION:
                var waitTime = this.getTimeInterval(this.network.settings.minTransactionCreationInterval, this.network.settings.avgTransactionCreationInterval);

                var sourceWallet = Utils.getRandomElement(processingNode.knownWallets);
                var targetAddress = Utils.getRandomElement(this.network.walletPool.getAllAddresses().filter(address => !address.equals(sourceWallet.publicKey)));
                var amount = 1 + Math.floor(Math.random() * 10);

                return [
                    this.eventFactory.createTransactionCreatingEvent(processingNode, sourceWallet, targetAddress, amount),
                    this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.TRANSACTION_GENERATION, waitTime)
                ];
            case CyclicEventsName.MINERS_SELECTION:
                var waitTime = this.network.settings.roundTime - (this.network.timer.currentTimestamp % this.network.settings.roundTime) + 1000;

                var nextProcessableEvents = [];

                processingNode.blockchain.leadingBlocks.forEach(leadingBlock => {
                    var miners = this.getMiners(leadingBlock);

                    leadingBlock.miners = miners;

                    var minersPerRound = this.network.settings.minersPerRound;
                    var timeQuantum = this.network.settings.roundTime / minersPerRound;
                    miners.forEach((miner, index) => {
                        if (miner === processingNode.knownWallets[0].publicKey.toString(16)) {
                            nextProcessableEvents.push(this.eventFactory.createWaitingEvent(processingNode, "block_mining", index * timeQuantum, { leadingBlock, selectedAddress: processingNode.knownWallets[0].publicKey }));
                        }
                    });
                })

                return [
                    ...nextProcessableEvents,
                    this.eventFactory.createWaitingEvent(processingNode, CyclicEventsName.MINERS_SELECTION, waitTime)
                ];
            case "block_mining":
                return [this.eventFactory.createBlockCreatingEvent(processingNode, processedEvent.additionalData.leadingBlock, processedEvent.additionalData.selectedAddress)];
        }
    }

    getTimeInterval(minInterval, avgInterval) {
        return minInterval + Math.random() * 2 * (avgInterval - minInterval);
    }

    getPeersDiscoveryTimeInterval(processingNode) {
        return processingNode.networkInterface.getLinksNumber() < this.network.settings.minLinksPerNode ?
            15000 + Math.random() * 10000 :
            300000 + Math.random() * 50000;
    }

    getMiners(leadingBlock) {
        var minersPerRound = this.network.settings.minersPerRound;
        var lastBlocks = [];
        var currentBlock = leadingBlock;
        while (lastBlocks.length < 2 * minersPerRound && currentBlock !== null) {
            lastBlocks.unshift(currentBlock.block);
            currentBlock = currentBlock.previousBlock;
        }

        var seedInputBlocks = lastBlocks.slice(0, minersPerRound);

        var seed = seedInputBlocks.map(block => parseInt(block.blockHash.toString()[1], 16) % 2).join('')
            + seedInputBlocks[seedInputBlocks.length - 1].blockBody.height
            + Math.floor(this.network.timer.currentTimestamp / this.network.settings.roundTime);

        return [...Array(minersPerRound).keys()]
            .map((_, index) => CryptoJS.SHA256(seed + index).toString())
            .map(hash => bigInt(hash, 16))
            .map(number => number.mod(leadingBlock.burnMap.summedInvervalsSize))
            .map(leadingBlock.burnMap.get.bind(leadingBlock.burnMap))
            .map(Vue.toRaw);
    }


}
