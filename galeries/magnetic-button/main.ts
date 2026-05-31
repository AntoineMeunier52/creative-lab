import MagneticButton from "./magnetic-button";

const el = document.querySelector<HTMLElement>(".magnetic-button");

if (el) {
  const button = new MagneticButton(el);

  button.on("enter", () => document.body.classList.add("active"));
  button.on("leave", () => document.body.classList.remove("active"));
}
