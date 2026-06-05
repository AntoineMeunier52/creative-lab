import QuadCursor from "./quadCursor";
import Card from "./card";

window.addEventListener("DOMContentLoaded", () => {
  const cursor = new QuadCursor();

  const card = new Card(document.querySelector("#card") as HTMLElement);

  card.on("attract", ({ corners, strength }) => {
    cursor.toCorners(corners, strength);
  });

  card.on("leave", () => {
    cursor.toIdle();
  });

  card.on("click", () => {
    console.log("click");
  });
});
