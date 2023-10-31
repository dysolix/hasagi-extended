export default abstract class AbstractDataCollection<T> {
    constructor(public readonly entries: T[]) { }

    toJSON() {
        return this.entries;
    }
}