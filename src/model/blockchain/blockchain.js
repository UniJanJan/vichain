export class Blockchain {
    constructor() {
        this.leadingBlocks = []; //TODO
    }

    appendBlock(block, burnMap) { //TODO
        if (this.leadingBlocks.length === 0 && block.blockBody.height === 0) {
            this.leadingBlocks.push(new LeadingBlock(block, burnMap));
        } else if (this.leadingBlocks.length > 0 && block.blockBody.height > 0) {
            //TODO
        }
    }
}

class LeadingBlock {
    constructor(block, burnMap) {
        this.block = block;
        this.burnMap = burnMap;
    }
}