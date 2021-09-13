import "./jscolor";
import "./style.css";

const app = {
  toolbar: document.querySelector(".toolbar"),
  mainSection: document.querySelector(".main-section"),
  bucketColor: "#fff",
  isEraser: false,
  currentColor: "#000",
  brushSize: 10,
  isEraser: false,
  SWITCH_TO_BRUSH_TIME: 15e2,
  localStorageName: "canvasSaved",
  drawnLines: [],
  lineNumber: 0,
  brushIcon: document.getElementById("brush"),
  downloadBtn: document.getElementById("download"),
  setDrawingsBtn: document.getElementById("save"),
  getDrawingsBtn: document.getElementById("upload"),
  removeDrawingsBtn: document.getElementById("trash"),
  brushColorInput: document.getElementById("brush-color"),
  eraserIcon: document.getElementById("eraser"),
  clearIcon: document.getElementById("undo"),
  activeToolElement: document.getElementById("active-tool"),
  brushSizeInput: document.getElementById("brush-size"),
  brushSizeElement: document.querySelector(".pen-value"),
  bucketColorInput: document.getElementById("bucket-color"),
  mobileBtn: document.getElementById("mobile-btn"),
  toolbar: document.querySelector(".toolbar"),
};
const canvas = document.createElement("canvas");
canvas.id = "canvas";
const context = canvas.getContext("2d");

window.onresize = () => {
  setUpCanvas();
  placeActiveTool();
};

//event listeners
setUpCanvas();
placeActiveTool();
app.eraserIcon.addEventListener("click", turnOnEraser);
app.brushIcon.addEventListener("click", switchToBrush);
app.brushSizeInput.addEventListener("change", changeBrushSize);
app.bucketColorInput.addEventListener("change", changeBucketColor);
app.brushColorInput.addEventListener("change", switchToBrush);
canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("touchemove", function() { e.preventDefault(); }, { passive:false });
app.clearIcon.addEventListener("click", clearCanvas);
app.downloadBtn.addEventListener("click", downloadImage);
app.setDrawingsBtn.addEventListener("click", saveLocaleStorage);
app.removeDrawingsBtn.addEventListener("click", removeFromLocaleStorage);
app.getDrawingsBtn.addEventListener("click", getLocalStorage);
app.mobileBtn.addEventListener("click", () =>
  app.toolbar.classList.toggle("visible")
);

function setUpCanvas() {
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  context.fillStyle = app.bucketColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  document.body.append(canvas);
  switchToBrush();
}

function placeActiveTool() {
  if (window.matchMedia("(max-width:1100px").matches) {
    document.body.append(app.activeToolElement);
  } else {
    document.querySelector(".toolbar-left").prepend(app.activeToolElement);
  }
}

//tools functions
function turnOnEraser() {
  app.isEraser = true;
  //changing color of buttons
  app.eraserIcon.classList.add("active");
  app.brushIcon.classList.remove("active");

  //changing parameters of brush
  app.currentColor = app.bucketColor;
  app.brushSize = 50;
  app.activeToolElement.textContent = "Eraser";
}

function changeBucketColor() {
  app.bucketColor = `#${app.bucketColorInput.value}`;
  setUpCanvas();
  switchToBrush();
  restoreCanvas();
}

function switchToBrush() {
  app.isEraser = false;
  //changing color of buttons and current mode text
  app.eraserIcon.classList.remove("active");
  app.brushIcon.classList.add("active");
  app.activeToolElement.textContent = "Brush";

  app.currentColor = `#${app.brushColorInput.value}`;
  app.brushSize = 10;
  app.brushSizeInput.value = 10;
  app.brushSizeElement.textContent = app.brushSize;
}

function delayedSwitchToBrush(ms) {
  setTimeout(switchToBrush, ms);
}

function changeBrushSize() {
  app.brushSize = app.brushSizeInput.value;
  displayBrushSize();
}

function displayBrushSize() {
  app.brushSizeElement.textContent =
    app.brushSize / 10 > 1 ? app.brushSize : `0${app.brushSize}`;
}

//functions for drawing
function startDrawing(event) {
  //setting up parameters
  const currentCoordinates = getCanvasedCoordinates(event);
  context.moveTo(currentCoordinates.x, currentCoordinates.y);
  context.beginPath();
  context.lineWidth = app.brushSize;
  context.strokeStyle = app.currentColor;
  context.lineCap = "round";

  app.drawnLines[app.lineNumber] = new Array();
  canvas.addEventListener("pointermove", continueDrawing);
  canvas.addEventListener("pointerup", removeCanvasListeners);
}

function continueDrawing(event) {
  const coordinates = getCanvasedCoordinates(event);
  context.lineTo(coordinates.x, coordinates.y);
  context.stroke();

  //saving drawn lines
  app.drawnLines[app.lineNumber].push({
    x: coordinates.x,
    y: coordinates.y,
    erased: app.isEraser,
    color: app.currentColor,
    width: app.brushSize,
  });
}

function removeCanvasListeners() {
  app.lineNumber++;
  canvas.removeEventListener("pointermove", continueDrawing);
  canvas.removeEventListener("pointerup", removeCanvasListeners);
}
function getCanvasedCoordinates(
  event,
  mouseX = event.clientX,
  mouseY = event.clientY
) {
  const canvasCoordinates = canvas.getBoundingClientRect();
  return {
    x: mouseX - canvasCoordinates.left,
    y: mouseY - canvasCoordinates.top,
  };
}

function restoreCanvas() {
  app.drawnLines.forEach((line) => {
    for (let i = 1; i < line.length; i++) {
      context.beginPath();
      if (!line[i].erased) {
        context.strokeStyle = line[i].color;
      } else {
        context.strokeStyle = app.bucketColor;
      }
      context.lineWidth = line[i].width;
      context.lineCap = "round";
      context.moveTo(line[i - 1].x, line[i - 1].y);
      context.lineTo(line[i].x, line[i].y);
      context.stroke();
    }
  });
}

function clearCanvas() {
  app.lineNumber = 0;
  app.drawnLines = [];
  setUpCanvas();
  app.activeToolElement.textContent = "Cleared Canvas!";
  delayedSwitchToBrush(app.SWITCH_TO_BRUSH_TIME);
}

function downloadImage() {
  app.downloadBtn.href = canvas.toDataURL("image/jpeg", 1);
  app.downloadBtn.download = "canvas-image.jpeg";

  app.activeToolElement.textContent = "File Image Saved!";
  delayedSwitchToBrush(app.SWITCH_TO_BRUSH_TIME);
}

function saveLocaleStorage() {
  localStorage.setItem(app.localStorageName, JSON.stringify(app.drawnLines));
  app.activeToolElement.textContent = "Saved to Local Storage!";
  delayedSwitchToBrush(app.SWITCH_TO_BRUSH_TIME);
}

function getLocalStorage() {
  const storedLines = localStorage.getItem(app.localStorageName);
  if (storedLines) {
    const oldLines = JSON.parse(storedLines);
    app.drawnLines = [...app.drawnLines, ...oldLines];
    restoreCanvas();
    app.activeToolElement.textContent = "Successfully uploaded!";
    delayedSwitchToBrush(app.SWITCH_TO_BRUSH_TIME);
  } else {
    delayedSwitchToBrush(app.SWITCH_TO_BRUSH_TIME);
  }
}

function removeFromLocaleStorage() {
  localStorage.removeItem(app.localStorageName);
  app.activeToolElement.textContent = "Deleted!";
  delayedSwitchToBrush(app.SWITCH_TO_BRUSH_TIME);
}
