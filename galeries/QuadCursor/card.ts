import { gsap } from "gsap";
import { EventEmitter } from "@lib";
import { getMousePos, map, clamp } from "@lib";

let mousePos = { x: 0, y: 0 };
window.addEventListener("mousemove", (e) => (mousePos = getMousePos(e)));

export default class Card extends EventEmitter<{
  attract: { corners: { x: number; y: number }[]; strength: number };
  leave: void;
  click: void;
}> {
  private el: HTMLElement;
  private corners: { x: number; y: number }[] = [];
  private rect: DOMRect;
  private attracting = false;

  // réglages des zones
  private nearRadius = 140; // bande de légère attirance autour de la card
  private maxNearPull = 0.28; // intensité max de l'attirance en approche

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
      case "clicked":
        this.emit("click", undefined);
        break;
    }
  }

  private onExit(_state: "idle" | "hovered" | "clicked") {
    //nothing for the moment,
    //clean here tween, aditional classes, listeners...
  }

  render() {
    const { left, top, right, bottom } = this.rect;
    const mx = mousePos.x;
    const my = mousePos.y;

    const dx = Math.max(left - mx, 0, mx - right);
    const dy = Math.max(top - my, 0, my - bottom);
    const distToRect = Math.hypot(dx, dy);

    const inside = distToRect <= 0;

    this.setState(inside ? "hovered" : "idle");

    // strength continu : 1 dedans, faible dans la bande de proximité, 0 au-delà
    let strength = 0;
    if (inside) {
      strength = 1;
    } else if (distToRect < this.nearRadius) {
      strength = clamp(
        map(distToRect, this.nearRadius, 0, 0, this.maxNearPull),
        0,
        this.maxNearPull,
      );
    }

    if (strength > 0) {
      this.emit("attract", { corners: this.corners, strength });
      this.attracting = true;
    } else if (this.attracting) {
      this.emit("leave", undefined);
      this.attracting = false;
    }
  }
}
