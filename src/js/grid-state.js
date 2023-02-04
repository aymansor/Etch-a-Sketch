import * as Main from "./main.js";

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
  return Main.gridCells.map((square) => square.style.backgroundColor);
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
    Main.gridCells.forEach((square, index) => {
      square.style.backgroundColor = undoStack[undoStep - 1][index];
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
    Main.gridCells.forEach((square, index) => {
      square.style.backgroundColor = redoStack[redoStep - 1][index];
    });
    redoStack.pop();
    decrementRedoStep();
  }
};

performUndoBtn.addEventListener("click", performUndo);
performRedoBtn.addEventListener("click", performRedo);

export { saveState, performUndo, performRedo, clearHistory };
