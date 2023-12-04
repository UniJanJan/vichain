export class Blockchain {
    constructor() {
        this.leadingBlocks = []; //TODO
    }

    appendBlock(block) { //TODO
        if (this.leadingBlocks.length === 0 && block.blockBody.height === 0) {
            this.leadingBlocks.push(block);
        } else if (this.leadingBlocks.length > 0 && block.blockBody.height > 0) {
            //TODO
        }
    }
}