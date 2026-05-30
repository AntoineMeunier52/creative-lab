const button = document.querySelector(".button");
const trigger = document.querySelector(".button-trigger");

const handleMouseMove = (e) => {
  const triggerRect = trigger.getBoundingClientRect();

  const centerX = triggerRect.left + triggerRect.width / 2;
  const centerY = triggerRect.top + triggerRect.height / 2;

  const deltaX = e.clientX - centerX;
  const deltaY = e.clientY - centerY;

  const normalizedX = deltaX / (triggerRect.width / 2);
  const normalizedY = deltaY / (triggerRect.height / 2);

  const boundaryX = Math.max(-1, Math.min(1, normalizedX));
  const boundaryY = Math.max(-1, Math.min(1, normalizedY));

  const absBoundaryX = Math.abs(boundaryX);
  const tX = absBoundaryX;
  const easeStrengthX = 1 - tX * tX * (3 - 2 * tX); // smoothstep inversée
  const moveX = boundaryX * easeStrengthX * 1.2;

  const absBoundaryY = Math.abs(boundaryY);
  const tY = absBoundaryY;
  const easeStrengthY = 1 - tY * tY * (3 - 2 * tY);
  const moveY = boundaryY * easeStrengthY * 1.2;

  if (Math.abs(normalizedX) <= 1 && Math.abs(normalizedY) <= 1) {
    window.requestAnimationFrame(() => moveButton(moveX, moveY));
  }
};

const moveButton = (x, y) => {
  button.style.transform = `translate(${100 * x * 0.3}px, ${100 * y}px)`;
};

addEventListener("mousemove", handleMouseMove);
