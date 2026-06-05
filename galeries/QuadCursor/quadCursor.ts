import { gsap } from "gsap";
import {
  CustomPane,
  getMousePos,
  lerp,
  distance,
  clamp,
  map,
  dampingFactor,
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

  // état de visée des quads
  private mode: "idle" | "corners" = "idle";
  private targets: { x: number; y: number }[] = [];
  private pull = 1; // 0 = position de base, 1 = pile sur les coins

  constructor() {
    this.cursor = document.querySelector(".cursor-wrapper") as HTMLElement;
    this.quadsCursor = Array.from(
      document.querySelectorAll(".cursor-quad"),
    ) as HTMLElement[];
    this.renderedMovement = {
      tx: { previous: 0, current: 0, amt: 0.2 },
      ty: { previous: 0, current: 0, amt: 0.2 },
    };
    this.renderedQuads = this.quadsCursor.map((_, index) => {
      const baseX = (index % 2) * 18;
      const baseY = Math.floor(index / 2) * 18;
      return {
        tx: { previous: baseX, current: baseX, amt: PARAMS.quads.amt },
        ty: { previous: baseY, current: baseY, amt: PARAMS.quads.amt },
        opacity: { previous: 1, current: 1, amt: PARAMS.quads.opacityAmt },
      };
    });
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
        x: (index % 2) * 18,
        y: Math.floor(index / 2) * 18,
      });
    });
  }

  // vise les 4 coins (coords viewport). strength : 0 = base, 1 = pile dans les coins
  toCorners(corners: { x: number; y: number }[], strength = 1) {
    this.targets = corners;
    this.pull = clamp(strength, 0, 1);
    this.mode = "corners";
  }

  // retour à la grille de base
  toIdle() {
    this.mode = "idle";
  }

  // time: current time, deltaTime: time elapsed since last frame, frame: current frame count
  render(_time: number, deltaTime: number, _frame: number) {
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

    // position courante du wrapper (viewport) : sert à convertir un coin en coords locales
    const wrapperX = this.renderedMovement.tx.previous;
    const wrapperY = this.renderedMovement.ty.previous;
    const half = 6; // moitié du quad (12px) pour le centrer sur le coin

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

      const baseX = (index % 2) * 18;
      const baseY = Math.floor(index / 2) * 18;
      const corner = this.targets[index];

      if (this.mode === "corners" && corner) {
        const cornerLocalX = corner.x - wrapperX - half;
        const cornerLocalY = corner.y - wrapperY - half;
        // strength interpole entre la base et le coin (légère attirance -> snap)
        renderedQuad.tx.current = lerp(baseX, cornerLocalX, this.pull);
        renderedQuad.ty.current = lerp(baseY, cornerLocalY, this.pull);
      } else {
        renderedQuad.tx.current = baseX;
        renderedQuad.ty.current = baseY;
      }

      renderedQuad.tx.previous = lerp(
        renderedQuad.tx.previous,
        renderedQuad.tx.current,
        dampingFactor(PARAMS.quads.amt, deltaTime),
      );
      renderedQuad.ty.previous = lerp(
        renderedQuad.ty.previous,
        renderedQuad.ty.current,
        dampingFactor(PARAMS.quads.amt, deltaTime),
      );
    });

    this.cursor.style.transform = `translate3d(${this.renderedMovement.tx.previous}px, ${this.renderedMovement.ty.previous}px, 0)`;
    this.quadsCursor.forEach((quad, index) => {
      const renderedQuad = this.renderedQuads[index];
      if (renderedQuad) {
        quad.style.opacity = renderedQuad.opacity.previous.toString();
        quad.style.transform = `translate3d(${renderedQuad.tx.previous}px, ${renderedQuad.ty.previous}px, 0)`;
      }
    });

    this.prevMousePos = { ...mousepos };
  }
}
