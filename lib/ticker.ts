class Ticker {
  private callbacks: Set<(dt: number) => void> = new Set();
  private lastTime = performance.now();

  constructor() {
    this.tick();
  }

  add(cb: (dt: number) => void) {
    this.callbacks.add(cb);
  }
  remove(cb: (dt: number) => void) {
    this.callbacks.delete(cb);
  }

  private tick = () => {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.callbacks.forEach((cb) => cb(dt));

    requestAnimationFrame(this.tick);
  };
}

const globalTicker = new Ticker();
export default globalTicker;