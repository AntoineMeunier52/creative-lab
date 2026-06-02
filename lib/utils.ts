//project point x from range [a, b] to [c, d]
const map = (x: number, a: number, b: number, c: number, d: number) =>
  ((x - a) * (d - c)) / (b - a) + c;

const clamp = (x: number, min: number, max: number) =>
  Math.min(Math.max(x, min), max);

const lerp = (a: number, b: number, n: number) => (1 - n) * a + n * b;

// amt = catch-up speed, dt = delta time between frames (ms), timeScale = time scale factor (default 0.1)
// The formula compensates for framerate: over the same REAL duration, the result
// is identical whether you're at 60 or 144 fps (more frames = smaller factor
// per frame, but more frames → same total catch-up over the duration).
const dampingFactor = (amt: number, dt: number, timeScale = 0.1) =>
  1 - Math.exp(-amt * dt * timeScale);

const getMousePos = (e: MouseEvent) => {
  return {
    x: e.clientX,
    y: e.clientY,
  };
};

const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.hypot(x2 - x1, y2 - y1);
};

const calcWinSize = () => {
  return { width: window.innerWidth, height: window.innerHeight };
};

export { map, clamp, lerp, dampingFactor, getMousePos, distance, calcWinSize };
