import { EventEmitter } from "@lib";
import { getMousePos, distance, lerpFactored, map, clamp } from "@lib";

export class Card extends EventEmitter<{
  "quad-click": { x: number; y: number };
}> {
  private el: HTMLElement;
  private state: "idle" | "hovered" | "clicked" = "idle";

  constructor(el: HTMLElement) {
    super();
    this.el = el;

    this.el.addEventListener("mouseenter", this.onMouseEnter);
    this.el.addEventListener("mouseleave", this.onMouseLeave);
    //this.el.addEventListener("click", this.onClick);
  }
}
