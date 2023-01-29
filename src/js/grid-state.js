import * as Main from "./main.js";

// [undo/redo stuff]
let undoStack = [];
let undoStep = 0;
let redoStack = [];
let redoStep = 0;

const getCurrentState = () => {
  return Main.gridSquares.map((square) => square.style.backgroundColor);
};

// Save current state
const saveState = () => {
  undoStack.push(getCurrentState());
  undoStep++;
};

const clearHistory = () => {
  undoStack = [];
  undoStep = 0;
  redoStack = [];
  redoStep = 0;
};

const performUndo = () => {
  // Check if there is at least one step to undo
  if (undoStep > 0) {
    // Save the current state of the grid to the redoStack
    redoStack.push(getCurrentState());
    redoStep++;

    // Loop over each square in the grid and update its background color
    // to the value in the undoStack at the current undoStep
    Main.gridSquares.forEach((square, index) => {
      square.style.backgroundColor = undoStack[undoStep - 1][index];
    });
    undoStack.pop();
    undoStep--;
  }
};

const performRedo = () => {
  // Check if there is at least one step to redo
  if (redoStep > 0) {
    // Save the current state of the grid to the undoStack
    saveState();

    // Loop over each square in the grid and update its background color
    // to the value in the redoStack at the current redoStep
    Main.gridSquares.forEach((square, index) => {
      square.style.backgroundColor = redoStack[redoStep - 1][index];
    });
    redoStack.pop();
    redoStep--;
  }
};

export { saveState, performUndo, performRedo, clearHistory };
