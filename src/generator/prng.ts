export class PRNG {
  private state: number;

  constructor(seed?: number) {
    if (seed === undefined) {
      this.state = Math.floor(Math.random() * 0xffffffff);
    } else {
      this.state = seed >>> 0;
    }
  }

  /**
   * Mulberry32 algorithm: fast, 32-bit PRNG with excellent statistical properties.
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    const r = this.next();
    return Math.floor(r * (max - min + 1)) + min;
  }

  public choice<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot choose from empty array');
    }
    const idx = this.nextInt(0, array.length - 1);
    return array[idx];
  }
}
