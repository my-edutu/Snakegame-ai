export class BoundedPool<T extends object> {
  readonly capacity: number;
  private readonly factory: () => T;
  private readonly available: T[] = [];
  private readonly inUse = new Set<T>();
  private destroyed = false;
  private created = 0;

  constructor(capacity: number, factory: () => T) {
    if (!Number.isInteger(capacity) || capacity <= 0) throw new Error('pool capacity must be a positive integer');
    this.capacity = capacity;
    this.factory = factory;
  }

  get createdCount(): number {
    return this.created;
  }

  get size(): number {
    return this.available.length + this.inUse.size;
  }

  get activeCount(): number {
    return this.inUse.size;
  }

  acquire(): T | null {
    if (this.destroyed) return null;
    const reused = this.available.pop();
    if (reused) {
      this.inUse.add(reused);
      return reused;
    }
    if (this.created >= this.capacity) return null;
    const value = this.factory();
    this.created += 1;
    this.inUse.add(value);
    return value;
  }

  release(value: T): void {
    if (this.destroyed || !this.inUse.delete(value)) return;
    this.available.push(value);
  }

  reset(): void {
    if (this.destroyed) return;
    for (const value of this.inUse) this.available.push(value);
    this.inUse.clear();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.available.length = 0;
    this.inUse.clear();
    this.created = 0;
  }
}
