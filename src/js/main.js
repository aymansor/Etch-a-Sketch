"use strict";

// DOM Elements
let grid = document.getElementById("grid");
let clearGridButton = document.getElementById("clear-grid");
const colorSelect = document.getElementById("color-select");
let toggleGrid = document.getElementById("toggle-grid");

// Global Variables
let gridSize = 16;
let gridBackgroundColor = window
  .getComputedStyle(document.documentElement)
  .getPropertyValue("--clr-grid");
let gridSquares = [];
let drawColor = colorSelect.value;

const CreateGrid = () => {
  gridSquares = []; //clearing the gridSquares variable
  for (let i = 0; i < gridSize * gridSize; i++) {
    let square = document.createElement("div");
    square.classList.add("grid-square");
    square.style.backgroundColor = gridBackgroundColor;
    square.style.width = `${100 / gridSize}%`;

    if (toggleGrid.checked) square.classList.add("grid-square-outline");

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

// Function to add or remove outline class based on checkbox state
const toggleOutline = () => {
  if (toggleGrid.checked) {
    gridSquares.forEach((square) =>
      square.classList.add("grid-square-outline")
    );
  } else {
    gridSquares.forEach((square) =>
      square.classList.remove("grid-square-outline")
    );
  }
};

function onGridChangeRange(value) {
  document.getElementById("grid-size-text").value = `${value}x${value}`;
  gridSize = Number(value);
  RemoveGrid();
  CreateGrid();
}

// Main function
let main = () => {
  // disable right click inside the grid
  grid.addEventListener("contextmenu", (e) => e.preventDefault());

  // create the grid
  CreateGrid();

  // Add a click event listener to the button
  clearGridButton.addEventListener("click", clearGrid);
  colorSelect.addEventListener("input", function () {
    drawColor = this.value;
  });
  // Add event listener to checkbox
  toggleGrid.addEventListener("change", toggleOutline);
};

main();
