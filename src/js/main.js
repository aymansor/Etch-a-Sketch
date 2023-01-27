"use strict";

let grid = document.getElementById("grid");

let gridSize = 16;
let gridColor = window
  .getComputedStyle(document.documentElement)
  .getPropertyValue("--clr-grid");

const CreateGrid = () => {
  for (let i = 0; i < gridSize * gridSize; i++) {
    let square = document.createElement("div");
    square.classList.add("grid-square");
    square.style.backgroundColor = "#ffffff";
    square.style.width = `${100 / gridSize}%`;
    grid.appendChild(square);
  }
};

CreateGrid();
