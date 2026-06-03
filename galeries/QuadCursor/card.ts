import { EventEmitter } from "@lib";
import {
  getMousePos,
  distance,
  calcWinSize,
  lerpFactored,
  map,
  clamp,
} from "@lib";

let mousePos = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => (mousePos = getMousePos(e)));

let windowSize = calcWinSize();
window.addEventListener("resize", () => (windowSize = calcWinSize()));

export class Card extends EventEmitter<{
  enter: { x: number; y: number }[];
  leave: void;
}> {
  private el: HTMLElement;
  private state: "idle" | "hovered" | "clicked" = "idle";
  private corners: { x: number; y: number }[] = [];
  private rect: DOMRect;

  constructor(el: HTMLElement) {
    super();
    this.el = el;
    this.rect = this.el.getBoundingClientRect();
    this.corners = this.calcCornersPos();

    window.addEventListener("resize", this.updateCorners);
    window.addEventListener("scroll", this.updateCorners, { passive: true });
  }

  private updateCorners = () => {
    this.rect = this.el.getBoundingClientRect();
    this.corners = this.calcCornersPos();
  };

  calcCornersPos() {
    const { left, top, width, height } = this.rect;
    return [
      { x: left, y: top },
      { x: left + width, y: top },
      { x: left, y: top + height },
      { x: left + width, y: top + height },
    ];
  }
}
