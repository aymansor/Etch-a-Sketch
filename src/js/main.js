"use strict";

// DOM Elements
let grid = document.getElementById("grid");
let clearGridButton = document.getElementById("clear-grid");
const colorSelect = document.getElementById("color-select");

// Global Variables
let gridSize = 16;
let gridBackgroundColor = window
  .getComputedStyle(document.documentElement)
  .getPropertyValue("--clr-grid");
let gridSquares = [];
let drawColor = "#000000";

const CreateGrid = () => {
  gridSquares = []; //clearing the gridSquares variable
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

    gridSquares.push(square);
    grid.appendChild(square);
  }
};

let gridAction = (event) => {
  // check if left mouse button is pressed
  if (event.buttons === 1) {
    event.target.style.backgroundColor = drawColor;
    // check if left mouse button is held down
  } else if (event.buttons === 2) {
    event.target.style.backgroundColor = gridBackgroundColor;
  }
};

const clearGrid = () => {
  // Set the background color of all grid squares to the gridBackgroundColor variable
  gridSquares.forEach((element) => {
    element.style.backgroundColor = gridBackgroundColor;
  });
};

const RemoveGrid = () => {
  gridSquares.forEach((item) => {
    item.remove();
  });
  gridSquares = []; //clearing the gridSquares variable
};

// Main function
let main = () => {
  // disable right click inside the grid
  grid.addEventListener("contextmenu", (e) => e.preventDefault());

  // create the grid
  CreateGrid();

  // Add a click event listener to the button
  clearGridButton.addEventListener("click", clearGrid);
  colorSelect.addEventListener("change", function () {
    drawColor = this.value;
  });
};

main();
