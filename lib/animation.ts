import EventEmitter from "./eventEmitter";

type AnitmationEvent = {
  start: void;
  update: { progress: number; value: Record<string, number> };
  complete: void;
};

type AnimationType = {
  delay?: number;
  repeat?: number;
  duration: number;
};

abstract class Animation extends EventEmitter<AnimationEvent> {
  delay() {}

  duration() {}
}
