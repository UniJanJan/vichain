import { DiscreteIntervalMap } from "../../common/interval_map.js";
import { EventHandler } from "./event_handler.js";

export class BlockVerifyingEventHandler extends EventHandler {
    constructor(network, eventFactory) {
        super(network, eventFactory);
    }

    handle(processingNode, processedEvent) { //TODO
        if (this.isBlockValid(processedEvent.block)) {
            var burnAddress = this.network.walletPool.getBurnAddress();
            var burnMap = new DiscreteIntervalMap();

            processedEvent.block.blockBody.transactions.forEach(transaction => {
                if (transaction.transactionBody.targetAddress.equals(burnAddress)) {
                    burnMap.push(transaction.transactionBody.amount, transaction.transactionBody.sourceAddress);
                }
            });

            processingNode.blockchain.appendBlock(processedEvent.block, burnMap);

            return []; // TODO
        } else {
            return [];
        }
    }

    isBlockValid(block) {
        return true; // TODO
    }
}