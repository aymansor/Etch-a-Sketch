"use strict";

import * as State from "./grid-state.js";

// DOM Elements
const grid = document.getElementById("grid");
const clearGridButton = document.getElementById("clear-grid");
const colorSelect = document.getElementById("color-select");
const toggleGrid = document.getElementById("toggle-grid");
const mouseTrailToggle = document.getElementById("mouse-trail-toggle");
const tools = document.getElementsByName("mode");
const saveBtn = document.getElementById("save-btn");
const gridRange = document.getElementById("grid-size-range");
const toggleBtn = document.querySelector("#toggle-settings");
const settingsPopup = document.querySelector("#settings-popup");

const toggleOutlineChecked =
  localStorage.getItem("toggleOutlineChecked") === "true";
const toggleMouseTrailChecked =
  localStorage.getItem("toggleMouseTrailChecked") === "true";

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
  // Enable trailing effect when hovering over the grid.
  // mouseTrail(event);

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
  }
  // check if middle mouse is clicked
  else if (event.button === 1) {
    selectColor(event.target);
  }
  // check if left mouse button is held down
  else if (event.buttons === 2) {
    event.target.style.backgroundColor = gridBackgroundColor;
  }
};

const mouseTrail = () => {
  localStorage.setItem("toggleMouseTrailChecked", mouseTrailToggle.checked);
  if (mouseTrailToggle.checked) {
    gridSquares.forEach((element) => {
      element.addEventListener("mouseover", mouseTrailEffect);
    });
  } else {
    gridSquares.forEach((element) => {
      element.removeEventListener("mouseover", mouseTrailEffect);
      element.classList.remove("single");
    });
  }
};

const mouseTrailEffect = (event) => {
  event.target.classList.add("hover");
  event.target.classList.add("single");
  event.target.addEventListener("transitionend", () =>
    event.target.classList.remove("hover")
  );
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
  State.clearHistory();
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
  localStorage.setItem("toggleOutlineChecked", toggleGrid.checked);
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
  localStorage.setItem("gridSize", gridSize);
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
        border: 0,
        margin: 0,
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

// [Color Swatches]
const colors = new Map([
  [
    "pixel",
    [
      "#8BC34A",
      "#FFC107",
      "#03A9F4",
      "#009688",
      "#E91E63",
      "#9C27B0",
      "#EA4848",
      "#FF5722",
      "#795548",
      "#CDDC39",
    ],
  ],

  [
    "nord",
    [
      "#BF616A",
      "#D08770",
      "#EBCB8B",
      "#A3BE8C",
      "#B48EAD",
      "#88C0D0",
      "#8FBCBB",
      "#4C566A",
      "#E5E9F0",
      "#2E3440",
    ],
  ],

  [
    "pastel",
    [
      "#FFC0CB",
      "#FFB6C1",
      "#DCFFFD",
      "#F0E6FF",
      "#FCB1FF",
      "#A4C4FF",
      "#B4C4FF",
      "#E1D2FF",
      "#FFC0FF",
      "#E8BFC4",
    ],
  ],

  [
    "earth",
    [
      "#8B5E3C",
      "#B45B04",
      "#B8860B",
      "#BDB76B",
      "#556B2F",
      "#8B2323",
      "#6B8E23",
      "#CD5C5C",
      "#8B008B",
      "#8B2252",
    ],
  ],

  [
    "neon",
    [
      "#FFFF33",
      "#00FFFF",
      "#FF00FF",
      "#00FF00",
      "#0000FF",
      "#FF3399",
      "#CCFF00",
      "#FF6600",
      "#0033CC",
      "#6600FF",
    ],
  ],
]);

const swatchColorsContainer = document.querySelector(
  "#swatch-colors-container"
);
const selectedSwatchName = document.getElementById("selected-swatch-name");
const swatchesKeys = Array.from(colors.keys());
const swatchesValues = Array.from(colors.values());
let swatchCurrentIndex = 0;

const getClickedSwatchColor = (event) => {
  drawColor = event.target.style.backgroundColor;
  colorSelect.value = rgbToHex(drawColor);
};

const createColorSwatch = () => {
  // get the first swatch key
  const firstKey = Array.from(colors.keys())[0];

  colors.get(firstKey).forEach((color) => {
    const swatchColor = document.createElement("div");
    swatchColor.classList.add("swatch-color");
    swatchColor.classList.add("inner-depth");
    swatchColor.style.backgroundColor = color;
    swatchColor.addEventListener("click", getClickedSwatchColor);
    swatchColorsContainer.appendChild(swatchColor);
  });

  selectedSwatchName.textContent = swatchesKeys[swatchCurrentIndex];
};

const swapSwatches = () => {
  const swatchColors = document.querySelectorAll(".swatch-color");

  swatchColors.forEach((color, index) => {
    color.style.backgroundColor = swatchesValues[swatchCurrentIndex][index];
  });
  selectedSwatchName.textContent = swatchesKeys[swatchCurrentIndex];
};

// Main function
const main = () => {
  // disable right click inside the grid
  grid.addEventListener("contextmenu", (e) => e.preventDefault());
  // handle keydown events
  document.addEventListener("keydown", handleKeydown);
  saveBtn.addEventListener("click", saveImage);

  createColorSwatch();

  document.querySelector("#swatch-left-arrow").addEventListener("click", () => {
    swatchCurrentIndex--;
    if (swatchCurrentIndex < 0) {
      swatchCurrentIndex = swatchesKeys.length - 1;
    }
    swapSwatches();
  });

  document
    .querySelector("#swatch-right-arrow")
    .addEventListener("click", () => {
      swatchCurrentIndex++;
      if (swatchCurrentIndex >= swatchesKeys.length) {
        swatchCurrentIndex = 0;
      }
      swapSwatches();
    });

  // Add a click event listener to the button
  clearGridButton.addEventListener("click", clearGrid);
  colorSelect.addEventListener("input", function () {
    drawColor = this.value;
  });

  // when the page load check if the toggleGrid was enabled before
  window.addEventListener("load", () => {
    if (localStorage.getItem("gridSize") !== null) {
      gridSize = localStorage.getItem("gridSize");
    }
    gridRange.value = gridSize;
    document.getElementById("grid-size-text").value = `${gridSize}x${gridSize}`;

    // create the grid
    CreateGrid();

    toggleGrid.checked = toggleOutlineChecked;
    toggleOutline();

    mouseTrailToggle.checked = toggleMouseTrailChecked;
    mouseTrail();
  });

  // Add event listener to checkbox
  toggleGrid.addEventListener("change", toggleOutline);
  mouseTrailToggle.addEventListener("change", mouseTrail);

  gridRange.addEventListener("input", (event) => {
    onGridChangeRange(event.target.value);
  });

  toggleBtn.addEventListener("click", function () {
    settingsPopup.classList.toggle("show");
  });
};

main();
