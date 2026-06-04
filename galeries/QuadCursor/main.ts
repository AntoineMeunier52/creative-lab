import QuadCursor from "./quadCursor";
import Card from "./card";

window.addEventListener("DOMContentLoaded", () => {
  new QuadCursor();

  const card = new Card(document.querySelector("#card") as HTMLElement);

  card.on("enter", (corners) => {
    console.log("enter", corners);
  });

  card.on("leave", () => {
    console.log("leave");
  });

  card.on("click", () => {
    console.log("click");
  });
});
