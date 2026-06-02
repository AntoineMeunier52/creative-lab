import { gsap } from "gsap";
import { CustomPane, getMousePos, lerp } from "@lib";

let mousepos = { x: 0, y: 0 };
window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

const PARAMS = {
  movement: {
    amt: 0.2,
    firstApparanceDuration: 0.9,
  },
  quads: {
    amt: 0.1,
    opacityAmt: 0.1,
    fadeInDuration: 0.9,
  },
};

const pane = new CustomPane({ title: "Quad Cursor" });

const movementFolder = pane.addFolder({ title: "Wrapper Movement" });
movementFolder.addBinding(PARAMS.movement, "amt", {
  min: 0,
  max: 1,
  step: 0.01,
});

const quadsFolder = pane.addFolder({ title: "Quads" });
quadsFolder.addBinding(PARAMS.quads, "amt", { min: 0, max: 1, step: 0.01 });
quadsFolder.addBinding(PARAMS.quads, "opacityAmt", {
  min: 0,
  max: 1,
  step: 0.01,
});
quadsFolder.addBinding(PARAMS.quads, "fadeInDuration", {
  min: 0,
  max: 2,
  step: 0.05,
});

export default class QuadCursor {
  private cursor: HTMLElement;
  private quadsCursor: HTMLElement[];
  private renderedMovement: {
    tx: { previous: number; current: number; amt: number };
    ty: { previous: number; current: number; amt: number };
  };
  private renderedQuads: {
    tx: { previous: number; current: number; amt: number };
    ty: { previous: number; current: number; amt: number };
    opacity: { previous: number; current: number; amt: number };
  }[];
  private bound: DOMRect;
  private onMouseMoveEv: () => void;

  constructor() {
    this.cursor = document.querySelector(".cursor-wrapper") as HTMLElement;
    this.quadsCursor = Array.from(
      document.querySelectorAll(".cursor-quad"),
    ) as HTMLElement[];
    this.renderedMovement = {
      tx: { previous: 0, current: 0, amt: 0.2 },
      ty: { previous: 0, current: 0, amt: 0.2 },
    };
    this.renderedQuads = this.quadsCursor.map(() => ({
      tx: { previous: 0, current: 0, amt: 0.1 },
      ty: { previous: 0, current: 0, amt: 0.1 },
      opacity: { previous: 1, current: 1, amt: 0.1 },
    }));
    this.bound = this.cursor.getBoundingClientRect();

    this.initialize();
    this.onMouseMoveEv = () => {
      this.renderedMovement.tx.previous = this.renderedMovement.tx.current =
        mousepos.x - this.bound.width / 2;
      this.renderedMovement.ty.previous = this.renderedMovement.ty.current =
        mousepos.y - this.bound.height / 2;
      this.quadsCursor.forEach((quad, index) => {
        const renderedQuad = this.renderedQuads[index];
        if (renderedQuad) {
          gsap.to(quad, {
            duration: PARAMS.movement.firstApparanceDuration,
            ease: "power3.out",
            opacity: 1,
          });
        }
      });
      gsap.ticker.add(() => this.render());
      window.removeEventListener("mousemove", this.onMouseMoveEv);
    };
    window.addEventListener("mousemove", this.onMouseMoveEv);
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
    this.renderedMovement.tx.current = mousepos.x - this.bound.width / 2;
    this.renderedMovement.ty.current = mousepos.y - this.bound.height / 2;

    const keys = Object.keys(this.renderedMovement) as Array<
      keyof typeof this.renderedMovement
    >;
    keys.forEach((key) => {
      this.renderedMovement[key].previous = lerp(
        this.renderedMovement[key].previous,
        this.renderedMovement[key].current,
        PARAMS.movement.amt,
      );
    });

    this.cursor.style.transform = `translate3d(${this.renderedMovement.tx.previous}px, ${this.renderedMovement.ty.previous}px, 0)`;
    this.quadsCursor.forEach((quad, index) => {
      const renderedQuad = this.renderedQuads[index];
      if (renderedQuad) {
        quad.style.opacity = renderedQuad.opacity.previous.toString();
      }
    });
  }
}
