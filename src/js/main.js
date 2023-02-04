"use strict";

import * as State from "./grid-state.js";

/* ------------------------------------------------------------------------- */
/*                                DOM ELEMENTS                               */
/* ------------------------------------------------------------------------- */

const grid = document.querySelector("#grid");
const clearGridButton = document.querySelector("#clear-grid");
const primaryColorInput = document.querySelector("#color-select");
const cellOutlineCheckbox = document.querySelector("#toggle-grid");
const mouseTrailToggle = document.querySelector("#mouse-trail-toggle");
const saveBtn = document.querySelector("#save-btn");
const gridSizeRange = document.querySelector("#grid-size-range");
const tools = document.getElementsByName("mode");
const toggleSettingsBtn = document.querySelector("#toggle-settings");
const settingsPopup = document.querySelector("#settings-popup");

/* ------------------------------------------------------------------------- */
/*                              GLOBAL VARIABLES                             */
/* ------------------------------------------------------------------------- */

/**
 * Stores the current grid size as a number
 * @type {Number}
 */
let gridSize = 16;

/**
 * Stores the current primary color as a hexadecimal string
 * @type {String}
 */
let primaryColor = primaryColorInput.value;

/**
 * Stores the current background color for the grid squares as a hexadecimal string
 * @type {String}
 */
let gridBackgroundColor = "#ffffff";

/**
 * An array that stores the individual grid cells in the grid
 * @type {Array.<HTMLDivElement>}
 */
export let gridCells = [];

/* ------------------------------------------------------------------------- */
/*                                 Grid Logic                                */
/* ------------------------------------------------------------------------- */

/* ------- Creating, clearing, deleting, and resizing the grid logic ------- */

/**
 * Creates a grid and appends it to the grid container.
 */
const CreateGrid = () => {
  // Clears the gridCells array before creating a new grid.
  gridCells = [];

  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("grid-square");
    cell.style.backgroundColor = gridBackgroundColor;
    cell.style.width = `${100 / gridSize}%`;

    if (cellOutlineCheckbox.checked) {
      cell.classList.add("grid-square-outline");
    }

    gridCells.push(cell);
    grid.appendChild(cell);
  }
};

// disable right click inside the grid
grid.addEventListener("contextmenu", (e) => e.preventDefault());

/**
 * Clears the grid and resets the undo/redo state history.
 */
const clearGrid = () => {
  // Clears the undo/redo state history.
  State.clearHistory();
  // Resets the background color of all cells to the default grid background color.
  gridCells.forEach((cell) => {
    cell.style.backgroundColor = gridBackgroundColor;
  });
};

clearGridButton.addEventListener("click", clearGrid);

const DeleteGrid = () => {
  gridCells.forEach((cell) => {
    cell.remove();
  });
  gridCells = [];
};

/**
 * Handles the resizing of the grid.
 *
 * @param {Number} value - The new grid size value.
 */
const handleGridResize = (value) => {
  State.clearHistory();

  document.querySelector("#grid-size-text").value = `${value}x${value}`;
  gridSize = Number(value);

  localStorage.setItem("gird-size", gridSize);

  DeleteGrid();
  CreateGrid();
};

gridSizeRange.addEventListener("input", (event) => {
  handleGridResize(event.target.value);
});

/* ----------------------------- Handle actions ---------------------------- */

/**
 * Handles the user actions on the grid.
 * Saves the current state on pointerdown before preforming any actions.
 * Then, delegates the action to either handleMouseActions or handleTouchActions.
 * @param {PointerEvent} event - The pointer event object.
 */
const handleUserAction = (event) => {
  // Save current state on first "pointerdown" event before performing actions.
  if (event.type === "pointerdown") {
    State.saveState();
  }

  if (event.pointerType === "mouse") {
    handleMouseActions(event);
  } else if (event.pointerType === "touch") {
    handleTouchActions(event);
  }
};

/**
 * Handles mouse actions on the grid by delegating to specific tool handlers
 * based on the mouse input pressed.
 *
 * @param {PointerEvent} event - The pointer event object.
 */
const handleMouseActions = (event) => {
  // Return if the target cell is not a valid grid square.
  const targetCell = event.target;
  if (targetCell === null || !targetCell.classList.contains("grid-square")) {
    return;
  }

  // Delegate event handling to the relevant tool function.
  switch (event.buttons) {
    // Left mouse button
    case 1:
      handleToolsActions(targetCell);
      break;
    // Right mouse button
    case 2:
      handleEraserTool(targetCell);
      break;
    // Middle mouse button
    case 4:
      handleColorPickerTool(targetCell);
      break;
    default:
      break;
  }
};

/**
 * Handle touch actions on the grid.
 *
 * @param {PointerEvent} event - The pointer event object.
 *
 * @returns {undefined}
 */
const handleTouchActions = (event) => {
  // Get the grid cell element based on the touch event's clientX and clientY
  // coordinates. If the element is not found or is not a grid cell, return
  // and do nothing.
  const targetCell = document.elementFromPoint(event.clientX, event.clientY);
  if (targetCell === null || !targetCell.classList.contains("grid-square")) {
    return;
  }

  handleToolsActions(targetCell);
};

/**
 * Handles tool actions on the grid by delegating to specific tool handlers
 * based on the active tool.
 *
 * @param {HTMLElement} target - The target grid cell element.
 */
const handleToolsActions = (target) => {
  // Delegate event handling to the relevant tool function.
  switch (getActiveTool()) {
    case "pencil":
      handlePenTool(target);
      break;
    case "eraser":
      handleEraserTool(target);
      break;
    case "picker":
      handleColorPickerTool(target);
      break;
    case "rainbow":
      handleRainbowTool(target);
      break;
  }
};

/* ------------------------------ Handle tools ----------------------------- */

/**
 * Changes the background color of the targeted cell to the current primary color.
 * @param {HTMLElement} target - The targeted cell to change color
 */
const handlePenTool = (target) => {
  target.style.backgroundColor = primaryColor;
};

/**
 * Changes the background color of the targeted cell to the grid background color.
 * @param {HTMLElement} target - The targeted cell to change color.
 */
const handleEraserTool = (target) => {
  target.style.backgroundColor = gridBackgroundColor;
};

/**
 * Changes the primary color and updates the primary color input, and changes the
 * active tool to the pencil tool.
 * @param {HTMLElement} target - The targeted cell to get the color from.
 */
const handleColorPickerTool = (target) => {
  primaryColor = target.style.backgroundColor;
  updatePrimaryColorInput();
  changeActiveTool("pencil");
};

/**
 * Changes the background color of the targeted cell to a random color.
 * @param {HTMLElement} target - The targeted cell to change color.
 */
const handleRainbowTool = (target) => {
  target.style.backgroundColor = getRandomColor();
};

/* ------------------------------ Tools Utils ------------------------------ */

/**
 * Returns the value of the selected active tool.
 * @returns {String} The value of the selected active tool or undefined if no tool is selected.
 */
const getActiveTool = () => {
  const activeTool = [...tools].find((tool) => tool.checked);
  return activeTool ? activeTool.value : undefined;
};

/**
 * Changes the active tool to the one passed to the function.
 * @param {String} toolName - The name of the tool to change to.
 */
const changeActiveTool = (toolName) => {
  tools.forEach(
    (tool) => (tool.checked = tool.value === toolName ? true : false)
  );
};

/**
 * Updates the primary color input to the current primary color
 */
const updatePrimaryColorInput = () => {
  primaryColorInput.value = rgbToHex(primaryColor);
};

/**
 * Updates the primary color to the primary color input value
 */
const onPrimaryColorInputChange = () => {
  primaryColor = primaryColorInput.value;
};

primaryColorInput.addEventListener("input", onPrimaryColorInputChange);

/**
 *
 * @param {String} rgb - An RGB color value string.
 * @returns The hexadecimal equivalent for the passed RGB value as a string.
 */
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

/**
 * Returns a random hexadecimal color
 * @returns A random hexadecimal color as a string
 */
const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/* ------------------------------ Grid effects ----------------------------- */

const toggleCellOutline = () => {
  const isChecked = cellOutlineCheckbox.checked;
  localStorage.setItem("cell-outline-checked", isChecked);

  gridCells.forEach((cell) => {
    cell.classList.toggle("grid-square-outline", isChecked);
  });
};

// Add event listener to checkbox
cellOutlineCheckbox.addEventListener("change", toggleCellOutline);

const handleMouseTrail = () => {
  localStorage.setItem("mouse-trail-checked", mouseTrailToggle.checked);
  if (mouseTrailToggle.checked) {
    gridCells.forEach((element) => {
      element.addEventListener("mouseover", mouseTrailEffect);
    });
  } else {
    gridCells.forEach((element) => {
      element.removeEventListener("mouseover", mouseTrailEffect);
      element.classList.remove("single");
    });
  }
};

mouseTrailToggle.addEventListener("change", handleMouseTrail);

const mouseTrailEffect = (event) => {
  event.target.classList.add("hover");
  event.target.classList.add("single");
  event.target.addEventListener("transitionend", () =>
    event.target.classList.remove("hover")
  );
};

/* ------------------------------------------------------------------------- */
/*                                 Shortcuts                                 */
/* ------------------------------------------------------------------------- */

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

// handle keydown events
document.addEventListener("keydown", handleKeydown);

/* ------------------------------------------------------------------------- */
/*                             Saving Image Logic                            */
/* ------------------------------------------------------------------------- */

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

saveBtn.addEventListener("click", saveImage);

/* ------------------------------------------------------------------------- */
/*                               Color Swatches                              */
/* ------------------------------------------------------------------------- */

// [Color Swatches]
const swatches = new Map([
  ["pixel", ["#8BC34A", "#FFC107", "#03A9F4", "#009688", "#E91E63", "#9C27B0"]],

  ["nord", ["#BF616A", "#D08770", "#EBCB8B", "#A3BE8C", "#B48EAD", "#88C0D0"]],

  [
    "pastel",
    ["#FFC0CB", "#FFB6C1", "#DCFFFD", "#F0E6FF", "#FCB1FF", "#A4C4FF"],
  ],

  ["earth", ["#8B5E3C", "#B45B04", "#B8860B", "#BDB76B", "#556B2F", "#8B2323"]],

  ["neon", ["#FFFF33", "#00FFFF", "#FF00FF", "#00FF00", "#0000FF", "#FF3399"]],
]);

const swatchColorsContainer = document.querySelector(
  "#swatch-colors-container"
);
const selectedSwatchName = document.getElementById("selected-swatch-name");
const swatchesKeys = Array.from(swatches.keys());
const swatchesValues = Array.from(swatches.values());
let swatchCurrentIndex = 0;

const getClickedSwatchColor = (event) => {
  primaryColor = event.target.style.backgroundColor;
  primaryColorInput.value = rgbToHex(primaryColor);
};

const createColorSwatch = () => {
  // get the first swatch key
  const firstKey = Array.from(swatches.keys())[0];

  swatches.get(firstKey).forEach((color) => {
    const swatchColor = document.createElement("div");
    swatchColor.classList.add("swatch-color");
    swatchColor.style.backgroundColor = color;
    swatchColor.addEventListener("click", getClickedSwatchColor);
    swatchColorsContainer.appendChild(swatchColor);
  });

  selectedSwatchName.textContent = swatchesKeys[swatchCurrentIndex];

  document
    .querySelector("#swatch-left-arrow")
    .addEventListener("click", handleSwatchLeftArrow);

  document
    .querySelector("#swatch-right-arrow")
    .addEventListener("click", handleSwatchRightArrow);
};

const swapSwatches = () => {
  const swatchColors = document.querySelectorAll(".swatch-color");

  swatchColors.forEach((color, index) => {
    color.style.backgroundColor = swatchesValues[swatchCurrentIndex][index];
  });
  selectedSwatchName.textContent = swatchesKeys[swatchCurrentIndex];
};

const handleSwatchLeftArrow = () => {
  swatchCurrentIndex--;
  if (swatchCurrentIndex < 0) {
    swatchCurrentIndex = swatchesKeys.length - 1;
  }
  swapSwatches();
};

const handleSwatchRightArrow = () => {
  swatchCurrentIndex++;
  if (swatchCurrentIndex >= swatchesKeys.length) {
    swatchCurrentIndex = 0;
  }
  swapSwatches();
};

/* ------------------------------------------------------------------------- */
/*                               SETTINGS POPUP                              */
/* ------------------------------------------------------------------------- */

const toggleSettingPopup = () => {
  settingsPopup.classList.toggle("show");
};

toggleSettingsBtn.addEventListener("click", toggleSettingPopup);

/* ------------------------------------------------------------------------- */
/*                                    Main                                   */
/* ------------------------------------------------------------------------- */

window.addEventListener("load", () => {
  // Get the gird size from local storage if it exists
  if (localStorage.getItem("gird-size") !== null) {
    gridSize = localStorage.getItem("gird-size");
  }
  gridSizeRange.value = gridSize;
  document.getElementById("grid-size-text").value = `${gridSize}x${gridSize}`;

  // Create the grid
  CreateGrid();
  grid.addEventListener("pointerdown", handleUserAction);
  grid.addEventListener("pointermove", handleUserAction);

  cellOutlineCheckbox.checked =
    localStorage.getItem("cell-outline-checked") === "true";
  toggleCellOutline();

  mouseTrailToggle.checked =
    localStorage.getItem("mouse-trail-checked") === "true";
  handleMouseTrail();

  createColorSwatch();
});
