//project point x from range [a, b] to [c, d]
const map = (x: number, a: number, b: number, c: number, d: number) =>
  ((x - a) * (d - c)) / (b - a) + c;

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

const getMousePos = (e: MouseEvent) => {
  return {
    x: e.clientX,
    y: e.clientY,
  };
};

const distance = (x1: number, x2: number, y1: number, y2: number) => {
  let a = x1 - x2;
  let b = y1 - y2;

  return Math.hypot(a, b);
};

const calcWinSize = () => {
  return { width: window.innerWidth, height: window.innerHeight };
};

export { map, lerp, getMousePos, distance, calcWinSize };
