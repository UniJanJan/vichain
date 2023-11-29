export class VersionMessage {
    constructor(version, shouldBePrioritized, block) {
        this.version = version;
        this.shouldBePrioritized = shouldBePrioritized;
        this.block = block; //TODO
        this.timestamp = 0; // TODO
        Object.freeze(this);
    }

    clone() {
        return new VersionMessage(this.version, this.block);
    }
}
