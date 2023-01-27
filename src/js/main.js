"use strict";

let grid = document.getElementById("grid");

let gridSize = 16;
let gridBackgroundColor = window
  .getComputedStyle(document.documentElement)
  .getPropertyValue("--clr-grid");

const CreateGrid = () => {
  for (let i = 0; i < gridSize * gridSize; i++) {
    let square = document.createElement("div");
    square.classList.add("grid-square");
    square.style.backgroundColor = gridBackgroundColor;
    square.style.width = `${100 / gridSize}%`;

    // Add mousedown event listener to each square
    square.addEventListener("mousedown", (event) => {
      gridAction(event);
    });

    // Add mouseover event listener to each square
    square.addEventListener("mouseover", (event) => {
      gridAction(event);
    });

    grid.appendChild(square);
  }
};

let gridAction = (event) => {
  // check if left mouse button is pressed
  if (event.buttons === 1) {
    event.target.style.backgroundColor = "black";
    // check if left mouse button is held down
  } else if (event.buttons === 2) {
    event.target.style.backgroundColor = gridBackgroundColor;
  }
};

let main = () => {
  // disable right click inside the grid
  grid.addEventListener("contextmenu", (e) => e.preventDefault());

  // create the grid
  CreateGrid();
};

main();
