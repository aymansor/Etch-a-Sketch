"use strict";

import * as State from "./grid-state.js";

// DOM Elements
const grid = document.getElementById("grid");
const clearGridButton = document.getElementById("clear-grid");
const colorSelect = document.getElementById("color-select");
const toggleGrid = document.getElementById("toggle-grid");
const tools = document.getElementsByName("mode");
const saveBtn = document.getElementById("save-btn");
const gridRange = document.getElementById("grid-size-range");

// Global Variables
let gridSize = 16;
let gridBackgroundColor = window
  .getComputedStyle(document.documentElement)
  .getPropertyValue("--clr-grid");
// TODO: move the grid logic out of main?
export let gridSquares = [];
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
      // Saves the current state before preforming any actions
      State.saveState();
      gridAction(event);
    });
    // Add mouseover event listener to each square
    square.addEventListener("mouseover", gridAction);

    gridSquares.push(square);
    grid.appendChild(square);
  }
};

const gridAction = (event) => {
  // check if left mouse button is pressed
  if (event.buttons === 1) {
    switch (getSelectedTool()) {
      case "pencil":
        event.target.style.backgroundColor = drawColor;
        break;
      case "eraser":
        event.target.style.backgroundColor = gridBackgroundColor;
        break;
      case "picker":
        selectColor(event.target);
        break;
      case "rainbow":
        event.target.style.backgroundColor = getRandomColor();
        break;
    }
    // check if left mouse button is held down
  } else if (event.buttons === 2) {
    event.target.style.backgroundColor = gridBackgroundColor;
  }
};

const selectColor = (square) => {
  drawColor = square.style.backgroundColor;
  colorSelect.value = rgbToHex(drawColor);
  tools.forEach((tool) => {
    if (tool.value === "pencil") {
      tool.checked = true;
    }
    if (tool.value === "picker") {
      tool.checked = false;
    }
  });
};

const getSelectedTool = () => {
  for (let i = 0; i < tools.length; i++) {
    if (tools[i].checked) {
      return tools[i].value;
    }
  }
};

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const rgbToHex = (rgb) => {
  return (
    "#" +
    rgb
      .slice(4, -1)
      .split(",")
      .map((x) => (+x).toString(16).padStart(2, 0))
      .join("")
  );
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

const onGridChangeRange = (value) => {
  State.clearHistory();
  document.getElementById("grid-size-text").value = `${value}x${value}`;
  gridSize = Number(value);
  RemoveGrid();
  CreateGrid();
};

const handleKeydown = (event) => {
  if (event.keyCode === 49) {
    // "1" key
    document.getElementById("pencil").checked = true;
  } else if (event.keyCode === 50) {
    // "2" key
    document.getElementById("eraser").checked = true;
  } else if (event.keyCode === 51) {
    // "3" key
    document.getElementById("picker").checked = true;
  } else if (event.keyCode === 52) {
    // "4" key
    document.getElementById("rainbow").checked = true;
  } else if (event.ctrlKey && event.shiftKey && event.code === "KeyZ") {
    State.performRedo();
  } else if (event.ctrlKey && event.code === "KeyZ") {
    State.performUndo();
  }
};

const saveImage = () => {
  domtoimage
    .toPng(grid, {
      style: {
        margin: "0",
        padding: "0",
        outline: "none",
        "box-shadow": "none",
        "border-radius": "none",
      },
    })
    .then(function (dataUrl) {
      // Create a new anchor element
      const a = document.createElement("a");

      // Set the href and download attributes for the anchor element
      a.href = dataUrl;
      a.download = "screenshot.png";

      // Click the anchor element to trigger the download
      a.click();
    });
};

// Main function
const main = () => {
  // disable right click inside the grid
  grid.addEventListener("contextmenu", (e) => e.preventDefault());
  // handle keydown events
  document.addEventListener("keydown", handleKeydown);
  saveBtn.addEventListener("click", saveImage);

  // create the grid
  CreateGrid();

  // Add a click event listener to the button
  clearGridButton.addEventListener("click", clearGrid);
  colorSelect.addEventListener("input", function () {
    drawColor = this.value;
  });
  // Add event listener to checkbox
  toggleGrid.addEventListener("change", toggleOutline);

  gridRange.addEventListener("input", (event) => {
    onGridChangeRange(event.target.value);
  });
};

main();
