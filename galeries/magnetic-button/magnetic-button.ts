import {
  CustomPane,
  EventEmitter,
  globalTicker,
  lerp,
  distance,
  getMousePos,
} from "@lib";

let mousepos = { x: 0, y: 0 };
window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

const PARAMS = {
  distanceToTrigger: 0.7,
  amt: 0.05,
  shadowAmt: 0.01,
  dist: 0.3,
  distShadow: 0.1,
};

const pane = new CustomPane({ title: "Magnetic Button" });
pane.addBinding(PARAMS, "distanceToTrigger", { min: 0, max: 3, step: 0.1 });
pane.addBinding(PARAMS, "amt", { min: 0, max: 0.5, step: 0.01 });
pane.addBinding(PARAMS, "shadowAmt", { min: 0, max: 0.5, step: 0.01 });
pane.addBinding(PARAMS, "dist", { min: 0, max: 1, step: 0.01 });
pane.addBinding(PARAMS, "distShadow", { min: 0, max: 1, step: 0.01 });

export default class MagneticButton extends EventEmitter<{
  enter: () => void;
  leave: () => void;
}> {
  private DOM: { el: HTMLElement; shadow: HTMLElement };
  private rect: DOMRect | undefined;
  private distanceToTrigger = 0;
  private renderedStyles: {
    tx: { previous: number; current: number; amt: number };
    ty: { previous: number; current: number; amt: number };
  };
  private renderedStylesShadow: {
    tx: { previous: number; current: number; amt: number };
    ty: { previous: number; current: number; amt: number };
  };
  private state: {
    hover: boolean;
  };
  onResize: (() => void) | undefined;

  constructor(el: HTMLElement) {
    super();
    this.DOM = { el, shadow: null as unknown as HTMLElement };
    this.DOM.shadow = document.querySelector(".button-shadow") as HTMLElement;
    this.renderedStyles = {
      tx: { previous: 0, current: 0, amt: 0.05 },
      ty: { previous: 0, current: 0, amt: 0.05 },
    };
    this.renderedStylesShadow = {
      tx: { previous: 0, current: 0, amt: 0.01 },
      ty: { previous: 0, current: 0, amt: 0.01 },
    };
    this.state = {
      hover: false,
    };

    this.calculateSizePostion();
    this.initEvents();
    globalTicker.add((dt) => this.render(dt));
  }

  calculateSizePostion() {
    this.rect = this.DOM.el.getBoundingClientRect();
    this.distanceToTrigger = this.rect.width * PARAMS.distanceToTrigger;
  }

  initEvents() {
    this.onResize = () => this.calculateSizePostion();
    window.addEventListener("resize", this.onResize);
  }

  render = (dt: number) => {
    if (!this.rect) {
      return;
    }

    const distanceToTrigger = this.rect.width * PARAMS.distanceToTrigger;

    const distanceMouseButton = distance(
      mousepos.x + window.scrollX,
      mousepos.y + window.scrollY,
      this.rect.left + this.rect.width / 2,
      this.rect.top + this.rect.height / 2,
    );

    let x = 0;
    let y = 0;
    let xShadow = 0;
    let yShadow = 0;

    //if (distanceMouseButton < this.distanceToTrigger) {
    if (distanceMouseButton < distanceToTrigger) {
      if (!this.state.hover) {
        this.enter();
      }
      const offsetX =
        mousepos.x + window.scrollX - (this.rect.left + this.rect.width / 2);
      const offsetY =
        mousepos.y + window.scrollY - (this.rect.top + this.rect.height / 2);
      x = offsetX * PARAMS.dist;
      y = offsetY * PARAMS.dist;
      xShadow = offsetX * PARAMS.distShadow;
      yShadow = offsetY * PARAMS.distShadow;
    } else if (this.state.hover) {
      this.leave();
    }

    this.renderedStyles.tx.current = x;
    this.renderedStyles.ty.current = y;
    this.renderedStylesShadow.tx.current = xShadow;
    this.renderedStylesShadow.ty.current = yShadow;

    const keys = Object.keys(this.renderedStyles) as Array<
      keyof typeof this.renderedStyles
    >;
    for (const key of keys) {
      const s = this.renderedStyles[key];
      const sShadow = this.renderedStylesShadow[key];
      const factor = 1 - Math.exp(-PARAMS.amt * dt * 0.1);
      const factorShadow = 1 - Math.exp(-PARAMS.shadowAmt * dt * 0.1);
      s.previous = lerp(s.previous, s.current, factor);
      sShadow.previous = lerp(sShadow.previous, sShadow.current, factorShadow);
    }

    this.DOM.el.style.transform = `translate3d(${this.renderedStyles.tx.previous}px, ${this.renderedStyles.ty.previous}px, 0)`;
    this.DOM.shadow.style.transform = `translate3d(${this.renderedStylesShadow.tx.previous}px, ${this.renderedStylesShadow.ty.previous}px, 0)`;
  };

  enter() {
    this.emit("enter", () => {});

    this.state.hover = true;
    this.DOM.el.classList.add("magnetic-button--hover");

    document.body.classList.add("active");
  }

  leave() {
    this.emit("leave", () => {});

    this.state.hover = false;
    this.DOM.el.classList.remove("magnetic-button--hover");

    document.body.classList.remove("active");
  }
}
