import EventEmitter from "./eventEmitter";
import type { EasingFunction } from "./type";
import globalTicker from "./ticker";
import { lerp } from "./utils";

type TweenEvents = {
  start: void;
  update: { progress: number; values: Record<string, number> };
  complete: void;
};

type TweenConfig = {
  duration: number;
  easing?: EasingFunction;
  delay?: number;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
};

export default class Tween extends EventEmitter<TweenEvents> {
  private elapsedTime: number = 0;
  private running: boolean = false;

  private from: Record<string, number>;
  private to: Record<string, number>;
  private duration: number;
  private easing: EasingFunction;
  private delay: number;

  constructor(
    from: Record<string, number>,
    to: Record<string, number>,
    config: TweenConfig,
  ) {
    super();
    this.from = from;
    this.to = to;
    this.duration = config.duration;
    this.easing = config.easing ?? ((t) => t); // linear par défaut
    this.delay = config.delay ?? 0;
  }

  play() {
    if (this.running) return this;
    this.running = true;
    this.elapsedTime = 0;
    globalTicker.add(this.update);
    this.emit("start", undefined);
    return this;
  }

  stop() {
    if (!this.running) return this;
    this.running = false;
    globalTicker.remove(this.update);
    return this;
  }

  private update = (dt: number) => {
    const cappedDt = Math.min(dt, 100);
    this.elapsedTime += cappedDt;

    if (this.elapsedTime < this.delay) return;

    const effectiveTime = this.elapsedTime - this.delay;
    const progress = Math.min(effectiveTime / this.duration, 1);
    const easedProgress = this.easing(progress);

    const values: Record<string, number> = {};
    for (const key in this.to) {
      const fromValue = this.from[key] ?? 0;
      const toValue = this.to[key] ?? 0;
      values[key] = lerp(fromValue, toValue, easedProgress);
    }

    this.emit("update", { progress: easedProgress, values });

    if (progress >= 1) {
      this.stop();
      this.emit("complete", undefined);
    }
  };
}
