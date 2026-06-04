import { gsap } from "gsap";
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
  click: void;
}> {
  private el: HTMLElement;
  private corners: { x: number; y: number }[] = [];
  private rect: DOMRect;

  private state: "idle" | "hovered" | "clicked" = "idle";
  private transitions: Record<string, string[]> = {
    idle: ["hovered"], //quads go in corners on hover
    hovered: ["idle", "clicked"], //quads go back to center on leave, and spin the quads wrapper on click
    clicked: ["hovered"], //quads stop spinning on click release, and stay in corners if mouse is still hovered, or go back to center if not
  };

  constructor(el: HTMLElement) {
    super();
    this.el = el;
    this.rect = this.el.getBoundingClientRect();
    this.corners = this.calcCornersPos();

    window.addEventListener("resize", this.updateCorners);
    window.addEventListener("scroll", this.updateCorners, { passive: true });

    gsap.ticker.add(() => this.render());
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

  setState(next: "idle" | "hovered" | "clicked") {
    if (!this.transitions[this.state]?.includes(next)) return;
    if (this.state === next) return;

    this.onExit(this.state);

    this.state = next;

    this.onEnter(next);
  }

  private onEnter(state: "idle" | "hovered" | "clicked") {
    switch (state) {
      case "hovered":
        this.emit("enter", this.corners);
        break;
      case "idle":
        this.emit("leave", undefined);
        break;
      case "clicked":
        this.emit("click", undefined);
        break;
    }
  }

  private onExit(state: "idle" | "hovered" | "clicked") {
    //nothing for the moment,
    //clean here tween, aditional classes, listeners...
  }

  render() {
    //check if mouse is inside the card rect
    const triggerDistance = 20; //20px outside the card rect
    const inside =
      mousePos.x > this.rect.left - triggerDistance &&
      mousePos.x < this.rect.right + triggerDistance &&
      mousePos.y > this.rect.top - triggerDistance &&
      mousePos.y < this.rect.bottom + triggerDistance;

    const distanceMouseCard = distance(
      mousePos.x,
      mousePos.y,
      this.rect.left + this.rect.width / 2,
      this.rect.top + this.rect.height / 2,
    );

    if (inside) {
      this.setState("hovered");
    } else {
      this.setState("idle");
    }
  }
}
