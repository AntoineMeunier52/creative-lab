import { gsap } from "gsap";
import { getMousePos } from "@lib";

let mousepos = { x: 0, y: 0 };
window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

export default class QuadCursor {
  private cursor: HTMLElement;
  private quadsCursor: HTMLElement[];

  constructor() {
    this.cursor = document.querySelector(".cursor-wrapper") as HTMLElement;
    this.quadsCursor = Array.from(
      document.querySelectorAll(".cursor-quad"),
    ) as HTMLElement[];

    this.initialize();
    gsap.ticker.add(() => this.render());
  }

  initialize() {
    this.quadsCursor.forEach((quad, index) => {
      gsap.set(quad, {
        x: Math.floor(index / 2) * 20,
        y: (index % 2) * 20,
      });
    });
  }

  render() {
    this.cursor;

    //here use lerp with damp to make the cursor movement smoother
    //and not tween at every frame to avoid performance issues
    //because that make a new tween at every frame and that can cause performance issues
    gsap.to(this.cursor, {
      x: mousepos.x,
      y: mousepos.y,
      ease: "power3.out",
    });
  }
}
