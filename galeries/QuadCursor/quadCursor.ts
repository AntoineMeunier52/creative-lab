import { gsap } from "gsap";
import {
  CustomPane,
  getMousePos,
  lerp,
  distance,
  clamp,
  map,
  dampingFactor,
  calcWinSize,
} from "@lib";
import { createNoise2D } from "simplex-noise";

// coordonnées viewport : le wrapper est en position:fixed, donc pas d'offset de scroll
let mousepos = { x: 0, y: 0 };
window.addEventListener("mousemove", (ev) => {
  mousepos = getMousePos(ev);
});

const noise2D = createNoise2D();

const PARAMS = {
  movement: {
    amt: 0.15, // suivi wrapper : 0.1-0.2 = smooth agréable
    firstApparanceDuration: 0.9, // ok
  },
  quads: {
    amt: 0.1,
    opacityAmt: 0.08, // lissage opacité : assez bas pour adoucir le noise
    fadeInDuration: 0.9,
  },
  velocityMax: 2, // vélocité (en px/ms) au-delà de laquelle on plafonne
  frequencyIdle: 0.0005, // respiration au repos : lente
  frequencyMax: 0.02, // respiration en sprint : ~10x plus rapide
  opacityMin: 0.4, // opacité basse de la respiration
  opacityMax: 1, // opacité haute
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
quadsFolder.addBinding(PARAMS, "opacityMin", { min: 0, max: 1, step: 0.05 });
quadsFolder.addBinding(PARAMS, "opacityMax", { min: 0, max: 1, step: 0.05 });

pane.addBinding(PARAMS, "velocityMax", { min: 0.1, max: 10, step: 0.1 });
pane.addBinding(PARAMS, "frequencyIdle", {
  min: 0.0001,
  max: 0.1,
  step: 0.0001,
});
pane.addBinding(PARAMS, "frequencyMax", { min: 0.01, max: 1, step: 0.01 });

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
  private renderedFrequency: {
    previous: number;
    current: number;
    amt: number;
  };
  private bound: DOMRect;
  private onMouseMoveEv: () => void;
  private prevMousePos = { x: 0, y: 0 };
  private phase = 0;

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
    this.renderedFrequency = { previous: 0, current: 0, amt: 0.1 };
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
      gsap.ticker.add((time, deltaTime, frame) =>
        this.render(time, deltaTime, frame),
      );
      window.removeEventListener("mousemove", this.onMouseMoveEv);
    };
    window.addEventListener("mousemove", this.onMouseMoveEv);
  }

  initialize() {
    this.quadsCursor.forEach((quad, index) => {
      gsap.set(quad, {
        x: Math.floor(index / 2) * 18,
        y: (index % 2) * 18,
      });
    });
  }

  // time: current time, deltaTime: time elapsed since last frame, frame: current frame count
  render(time: number, deltaTime: number, frame: number) {
    this.renderedMovement.tx.current = mousepos.x - this.bound.width / 2;
    this.renderedMovement.ty.current = mousepos.y - this.bound.height / 2;

    const keys = Object.keys(this.renderedMovement) as Array<
      keyof typeof this.renderedMovement
    >;
    keys.forEach((key) => {
      this.renderedMovement[key].previous = lerp(
        this.renderedMovement[key].previous,
        this.renderedMovement[key].current,
        dampingFactor(PARAMS.movement.amt, deltaTime),
      );
    });

    //calc velocity and map it to a frequency for the noise
    const rawVelocity =
      distance(
        mousepos.x,
        mousepos.y,
        this.prevMousePos.x,
        this.prevMousePos.y,
      ) / deltaTime;

    //clamp velocity to avoid crazy values
    const clampedVelocity = clamp(rawVelocity, 0, PARAMS.velocityMax);

    this.renderedFrequency.current = map(
      clampedVelocity,
      0,
      PARAMS.velocityMax,
      PARAMS.frequencyIdle,
      PARAMS.frequencyMax,
    );

    this.renderedFrequency.previous = lerp(
      this.renderedFrequency.previous,
      this.renderedFrequency.current,
      dampingFactor(this.renderedFrequency.amt, deltaTime),
    );

    this.phase += deltaTime * this.renderedFrequency.previous;

    this.renderedQuads.forEach((renderedQuad, index) => {
      const offset = index * 100;
      const noiseValue = noise2D(this.phase + offset, 0); //return noise between -1 and 1
      renderedQuad.opacity.current = map(
        noiseValue,
        -1,
        1,
        PARAMS.opacityMin,
        PARAMS.opacityMax,
      );

      renderedQuad.opacity.previous = lerp(
        renderedQuad.opacity.previous,
        renderedQuad.opacity.current,
        dampingFactor(PARAMS.quads.opacityAmt, deltaTime),
      ); //interpolate opacity for smooth transition
    });

    this.cursor.style.transform = `translate3d(${this.renderedMovement.tx.previous}px, ${this.renderedMovement.ty.previous}px, 0)`;
    this.quadsCursor.forEach((quad, index) => {
      const renderedQuad = this.renderedQuads[index];
      if (renderedQuad) {
        quad.style.opacity = renderedQuad.opacity.previous.toString();
      }
    });

    this.prevMousePos = { ...mousepos };
  }
}
