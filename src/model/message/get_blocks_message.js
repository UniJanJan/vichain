export class GetBlocksMessage {
    constructor() {
        // probably height

        Object.freeze(this);
    }

    clone() {
        return new GetBlocksMessage();
    }
}