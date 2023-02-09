"use strict";

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
 * A matrix that stores the individual grid cells in the grid
 * @type {Array.<Array.<HTMLDivElement>>}
 */
let gridMatrix = [];

/**
 * Stores the last cell element
 * @type {Object.<HTMLDivElement>}
 */
let lastCell = null;

/**
 * @type {boolean}
 */
let isMouseDown = false;

/**
 * @type {Number}
 */
let brushSize = 0;

/* ------------------------------------------------------------------------- */
/*                                 Grid Logic                                */
/* ------------------------------------------------------------------------- */

/* ------- Creating, clearing, deleting, and resizing the grid logic ------- */

/**
 * Creates a grid and appends it to the grid container.
 */
const CreateGrid = () => {
  // Clears the matrix before creating a new grid.
  gridMatrix = [];

  for (let i = 0; i < gridSize; i++) {
    gridMatrix[i] = [];
    for (let j = 0; j < gridSize; j++) {
      const cell = document.createElement("div");
      cell.classList.add("grid-square");
      cell.style.backgroundColor = gridBackgroundColor;
      cell.style.width = `${100 / gridSize}%`;

      if (cellOutlineCheckbox.checked) {
        cell.classList.add("grid-square-outline");
      }
      cell.dataset.index = `${i}x${j}`;
      gridMatrix[i][j] = cell;
      grid.appendChild(cell);
    }
  }
};

/**
 * Clears the grid and resets the undo/redo state history.
 */
const clearGrid = () => {
  // Clears the undo/redo state history.
  clearHistory();
  // Resets the background color of all cells to the default grid background color.
  forEachCell((cell) => {
    cell.style.backgroundColor = gridBackgroundColor;
  });
};

/**
 * A function that removes each cell from the grid and clears the grid matrix.
 */
const DeleteGrid = () => {
  forEachCell((cell) => {
    cell.remove();
  });

  gridMatrix = [];
};

/**
 * Handles the resizing of the grid.
 *
 * @param {Number} value - The new grid size value.
 */
const handleGridResize = (value) => {
  clearHistory();

  document.querySelector("#grid-size-text").value = `${value}x${value}`;
  gridSize = Number(value);

  localStorage.setItem("gird-size", gridSize);

  DeleteGrid();
  CreateGrid();
};

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
    saveState();

    // on pointerdown, set the lastCell to null so that each time the user clicks on
    // the same cell, it can be modified
    lastCell = null;
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

  // if the lastCell is the same as the target just return and do nothing
  if (lastCell === event.target) return;

  lastCell = event.target;

  // Delegate event handling to the relevant tool function.
  switch (event.buttons) {
    // Left mouse button
    case 1:
      handleToolsActions(targetCell);
      break;
    // Right mouse button
    case 2:
      if (getActiveTool() === "lighten-darken") {
        handleLightenDarkenTool(targetCell, "darken", -5);
      } else {
        handleEraserTool(targetCell);
      }
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
    case "lighten-darken":
      handleLightenDarkenTool(target, "lighten", 5);
      break;
  }
};

/* ------------------------------ Handle tools ----------------------------- */

const handleBrushSize = (target, color) => {
  let [i, j] = getTargetIndex(target);

  const size = brushSize;
  const rows = gridSize;
  const cols = gridSize;

  // Loop through all cells around the cell of the given index (i,j) of interest
  for (let x = i - size; x <= i + size; x++) {
    for (let y = j - size; y <= j + size; y++) {
      // Check if the indices are valid, within the bounds of the matrix
      if (x >= 0 && x < rows && y >= 0 && y < cols) {
        // Check if the cell is not the same as the cell of interest
        if (x !== i || y !== j) {
          gridMatrix[x][y].style.backgroundColor = color;
        }
      }
    }
  }
};

/**
 * Changes the background color of the targeted cell to the current primary color.
 * @param {HTMLElement} target - The targeted cell to change color
 */
const handlePenTool = (target) => {
  target.style.backgroundColor = primaryColor;

  if (brushSize >= 1) {
    handleBrushSize(target, primaryColor);
  }
};

/**
 * Changes the background color of the targeted cell to the grid background color.
 * @param {HTMLElement} target - The targeted cell to change color.
 */
const handleEraserTool = (target) => {
  target.style.backgroundColor = gridBackgroundColor;

  if (brushSize >= 1) {
    handleBrushSize(target, gridBackgroundColor);
  }
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

  if (brushSize >= 1) {
    handleBrushSize(target, getRandomColor());
  }
};

/**
 *
 * @param {HTMLElement} target - The targeted cell to change color.
 * @param {String} operation - Lighten or darken
 * @param {Number} percentage - The amount to lighten or darken the cell
 * @returns
 */
const handleLightenDarkenTool = (target, operation, percentage) => {
  const originalColor = target.style.backgroundColor;

  // Extract the red, green, and blue values from the RGB string
  let [red, green, blue] = originalColor.match(/\d+/g).map((x) => parseInt(x));

  // Return early if the input RGB value is already white for the lighten tool
  // or black for the darken tool to avoid unnecessary calculations
  if (operation === "lighten" && red === 255 && green === 255 && blue === 255)
    return;

  if (operation === "darken" && red === 0 && green === 0 && blue === 0) return;

  // Convert the RGB values to HSL
  const hsl = rgbToHsl(red, green, blue);

  let h = hsl[0];
  let s = hsl[1];
  let l = hsl[2];

  // Increase or decrease the lightness by the specified percentage
  l = Math.min(100, Math.max(0, l + percentage));

  const color = "hsl(" + h + "," + s + "%," + l + "%)";
  target.style.backgroundColor = color;
};

/* ------------------------------ Tools Utils ------------------------------ */

/**
 * A helper function that applies the given callback function to each cell in the grid matrix.
 *
 * @param {function} callback - The callback function to be applied to each cell.
 */
const forEachCell = (callback) => {
  gridMatrix.forEach((row) => {
    row.forEach((cell) => {
      callback(cell);
    });
  });
};

const getTargetIndex = (target) => {
  const str = target.dataset.index;
  return str.split("x").map((index) => parseInt(index));
};

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

// Great explanation on how to convert RGB to HSL
// https://stackoverflow.com/questions/39118528/rgb-to-hsl-conversion
/**
 * Convert RGB color to HSL
 * @param {Number} r - Red value
 * @param {Number} g - Green value
 * @param {Number} b - Blue value
 * @returns The HSL equivalent for the passed RGB value as an array.
 */
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);

  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
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

  forEachCell((cell) => {
    cell.classList.toggle("grid-square-outline", isChecked);
  });
};

const handleMouseTrail = () => {
  localStorage.setItem("mouse-trail-checked", mouseTrailToggle.checked);
  if (mouseTrailToggle.checked) {
    forEachCell((cell) => {
      cell.addEventListener("mouseover", mouseTrailEffect);
    });
  } else {
    forEachCell((cell) => {
      cell.removeEventListener("mouseover", mouseTrailEffect);
      cell.classList.remove("single");
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

/* ------------------------------------------------------------------------- */
/*                                STATE LOGIC                                */
/* ------------------------------------------------------------------------- */

const performUndoBtn = document.querySelector("#perform-undo-btn");
const performRedoBtn = document.querySelector("#perform-redo-btn");
const undoRedoStepsLabels = document.querySelectorAll(".undo-redo-steps");

let undoStack = [];
let undoStep = 0;
let redoStack = [];
let redoStep = 0;

const updateUndoRedoStepLabel = (index, step) => {
  undoRedoStepsLabels[index].textContent = step;
};

const incrementUndoStep = () => {
  undoStep++;
  updateUndoRedoStepLabel(0, undoStep);
};

const decrementUndoStep = () => {
  undoStep--;
  updateUndoRedoStepLabel(0, undoStep);
};

const resetUndoStep = () => {
  undoStack = [];
  undoStep = 0;
  updateUndoRedoStepLabel(0, undoStep);
};

const incrementRedoStep = () => {
  redoStep++;
  updateUndoRedoStepLabel(1, redoStep);
};

const decrementRedoStep = () => {
  redoStep--;
  updateUndoRedoStepLabel(1, redoStep);
};

const resetRedoStep = () => {
  redoStack = [];
  redoStep = 0;
  updateUndoRedoStepLabel(1, redoStep);
};

const getCurrentState = () => {
  return gridMatrix.map((row) => row.map((cell) => cell.style.backgroundColor));
};

// Save current state
const saveState = () => {
  undoStack.push(getCurrentState());
  incrementUndoStep();
};

const clearHistory = () => {
  resetUndoStep();
  resetRedoStep();
};

const performUndo = () => {
  // Check if there is at least one step to undo
  if (undoStep > 0) {
    // Save the current state of the grid to the redoStack
    redoStack.push(getCurrentState());
    incrementRedoStep();

    // Loop over each square in the grid and update its background color
    // to the value in the undoStack at the current undoStep
    undoStack[undoStep - 1].forEach((row, i) => {
      row.forEach((color, j) => {
        gridMatrix[i][j].style.backgroundColor = color;
      });
    });

    undoStack.pop();
    decrementUndoStep();
  }
};

const performRedo = () => {
  // Check if there is at least one step to redo
  if (redoStep > 0) {
    // Save the current state of the grid to the undoStack
    saveState();

    // Loop over each square in the grid and update its background color
    // to the value in the redoStack at the current redoStep
    redoStack[redoStep - 1].forEach((row, i) => {
      row.forEach((color, j) => {
        gridMatrix[i][j].style.backgroundColor = color;
      });
    });

    redoStack.pop();
    decrementRedoStep();
  }
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
  } else if (event.keyCode === 53) {
    // "5" key
    document.getElementById("lighten-darken").checked = true;
  } else if (event.ctrlKey && event.shiftKey && event.code === "KeyZ") {
    performRedo();
  } else if (event.ctrlKey && event.code === "KeyZ") {
    performUndo();
  }
};

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
/*                                 BRUSH SIZE                                */
/* ------------------------------------------------------------------------- */

const brushSizeInputs = document.getElementsByName("brush-size-input");
const changeBrushSize = document.querySelector("#change-brush-size");
const brushSizeContainer = document.querySelector(".brush-size-container");

const getActiveBrushSize = () => {
  const activeSize = [...brushSizeInputs].find((size) => size.checked);
  return activeSize ? activeSize.value : undefined;
};

/* ------------------------------------------------------------------------- */
/*                               SETTINGS POPUP                              */
/* ------------------------------------------------------------------------- */

const toggleSettingPopup = () => {
  settingsPopup.classList.toggle("show");
};

/* ------------------------------------------------------------------------- */
/*                             DARK & LIGHT MODE                             */
/* ------------------------------------------------------------------------- */
const modeSwitch = document.getElementById("mode-switch");
const modeSwitchIcon = document.getElementById("mode-switch-icon");

const toggleClass = (element, className) => {
  element.classList.toggle(className);
};

// Check if dark mode is currently enabled
let darkModeEnabled = localStorage.getItem("dark-mode") === "enabled";

// Apply the dark-mode class to the document element
// and toggle the icon classes based on the dark mode state
document.documentElement.classList.toggle("dark-mode", darkModeEnabled);
modeSwitchIcon.classList.toggle("fa-sun", !darkModeEnabled);
modeSwitchIcon.classList.toggle("fa-moon", darkModeEnabled);

modeSwitch.addEventListener("click", () => {
  darkModeEnabled = localStorage.getItem("dark-mode") === "enabled";
  // Toggle the dark-mode class on the document element
  document.documentElement.classList.toggle("dark-mode");
  // Toggle the icon classes
  toggleClass(modeSwitchIcon, "fa-sun");
  toggleClass(modeSwitchIcon, "fa-moon");
  // Update the local storage value
  if (darkModeEnabled) {
    localStorage.removeItem("dark-mode");
  } else {
    localStorage.setItem("dark-mode", "enabled");
  }
});

/* ------------------------------------------------------------------------- */
/*                              Event Listeners                              */
/* ------------------------------------------------------------------------- */

/* ---------------------------------- Grid --------------------------------- */
// disable right click inside the grid
grid.addEventListener("contextmenu", (e) => e.preventDefault());

clearGridButton.addEventListener("click", clearGrid);

gridSizeRange.addEventListener("input", (event) => {
  handleGridResize(event.target.value);
});

primaryColorInput.addEventListener("input", onPrimaryColorInputChange);

// Add event listener to checkbox
cellOutlineCheckbox.addEventListener("change", toggleCellOutline);
mouseTrailToggle.addEventListener("change", handleMouseTrail);

/* --------------------------------- State --------------------------------- */
performUndoBtn.addEventListener("click", performUndo);
performRedoBtn.addEventListener("click", performRedo);
/* ------------------------------- Shortcuts ------------------------------- */
// handle keydown events
document.addEventListener("keydown", handleKeydown);
/* ------------------------------- Save Image ------------------------------ */
saveBtn.addEventListener("click", saveImage);
/* ------------------------------- Brush Size ------------------------------ */
changeBrushSize.addEventListener("click", () => {
  brushSizeContainer.classList.toggle("active");
  window.addEventListener(
    "click",
    () => {
      if (brushSizeContainer.classList.contains("active")) {
        brushSizeContainer.classList.remove("active");
      }
    },
    true
  );
});

brushSizeInputs.forEach((button) => {
  button.addEventListener("change", (event) => {
    brushSize = Number(event.target.value - 1);
  });
});
/* -------------------------------- settings ------------------------------- */
toggleSettingsBtn.addEventListener("click", toggleSettingPopup);
/* -------------------------------- On load -------------------------------- */
window.addEventListener("load", () => {
  // Get the gird size from local storage if it exists
  if (localStorage.getItem("gird-size") !== null) {
    gridSize = localStorage.getItem("gird-size");
  }
  gridSizeRange.value = gridSize;
  document.getElementById("grid-size-text").value = `${gridSize}x${gridSize}`;

  // Create the grid
  CreateGrid();

  grid.addEventListener("pointerdown", (event) => {
    isMouseDown = true;
    handleUserAction(event);
  });

  grid.addEventListener("pointermove", (event) => {
    if (isMouseDown) {
      handleUserAction(event);
    }
  });

  grid.addEventListener("pointerup", () => {
    isMouseDown = false;
  });

  cellOutlineCheckbox.checked =
    localStorage.getItem("cell-outline-checked") === "true";
  toggleCellOutline();

  mouseTrailToggle.checked =
    localStorage.getItem("mouse-trail-checked") === "true";
  handleMouseTrail();

  createColorSwatch();
});
