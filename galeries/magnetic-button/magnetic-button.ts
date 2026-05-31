import { EventEmitter, globalTicker, lerp, distance, getMousePos } from "@lib";

let mousepos = { x: 0, y: 0 };
window.addEventListener("mousemove", (ev) => (mousepos = getMousePos(ev)));

export default class MagneticButton extends EventEmitter<{
  enter: () => void;
  leave: () => void;
}> {
  private DOM: { el: HTMLElement };
  private rect: DOMRect | undefined;
  private distanceToTrigger = 0;
  private renderedStyles: {
    tx: { previous: number; current: number; amt: number };
    ty: { previous: number; current: number; amt: number };
  };
  private state: {
    hover: boolean;
  };
  onResize: (() => void) | undefined;

  constructor(el: HTMLElement) {
    super();
    this.DOM = { el };
    this.renderedStyles = {
      tx: { previous: 0, current: 0, amt: 0.1 },
      ty: { previous: 0, current: 0, amt: 0.1 },
    };
    this.state = {
      hover: false,
    };

    this.calculateSizePostion();
    this.initEvents();
    globalTicker.add(this.render);
  }

  calculateSizePostion() {
    this.rect = this.DOM.el.getBoundingClientRect();
    this.distanceToTrigger = this.rect.width * 0.7;
  }

  initEvents() {
    this.onResize = () => this.calculateSizePostion();
    window.addEventListener("resize", this.onResize);
  }

  render = () => {
    if (!this.rect) {
      return;
    }

    const distanceMouseButton = distance(
      mousepos.x + window.scrollX,
      mousepos.y + window.scrollY,
      this.rect.left + this.rect.width / 2,
      this.rect.top + this.rect.height / 2,
    );

    let x = 0;
    let y = 0;

    if (distanceMouseButton < this.distanceToTrigger) {
      if (!this.state.hover) {
        this.enter();
      }
      x =
        (mousepos.x + window.scrollX - (this.rect.left + this.rect.width / 2)) *
        0.3;
      y =
        (mousepos.y + window.scrollY - (this.rect.top + this.rect.height / 2)) *
        0.3;
    } else if (this.state.hover) {
      this.leave();
    }

    this.renderedStyles.tx.current = x;
    this.renderedStyles.ty.current = y;

    const keys = Object.keys(this.renderedStyles) as Array<
      keyof typeof this.renderedStyles
    >;
    for (const key of keys) {
      const s = this.renderedStyles[key];
      s.previous = lerp(s.previous, s.current, s.amt);
    }

    this.DOM.el.style.transform = `translate3d(${this.renderedStyles.tx.previous}px, ${this.renderedStyles.ty.previous}px, 0)`;
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
