// constants & state
const CANVAS_BG = '#f7f7f7';
const colors = ['#8B0000','#FFB6C1','#00008B','#87CEFA','#006400','#FFFF00','#000000','#FFFFFF'];
let currentColor = colors[0],
    brushSize    = 3,
    isErasing    = false,
    drawing      = false,
    lastX = 0, lastY = 0;

// history stacks
const undoStack = [], redoStack = [];

// build palette
const paletteGrid = document.getElementById('palette-grid');
colors.forEach(col => {
  const sw = document.createElement('div');
  sw.className = 'swatch';
  sw.style.setProperty('--swatch-color', col);
  sw.addEventListener('click', () => {
    currentColor = col;
    isErasing = false;
    eraserBtn.style.background = '#ddd';
    document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
    sw.classList.add('selected');
  });
  paletteGrid.appendChild(sw);
});
// initial selection
paletteGrid.children[0].classList.add('selected');

// build buttons row
const buttonsGrid = document.getElementById('buttons-grid');

// 1) Settings ⚙️
const settingsContainer = document.createElement('div');
settingsContainer.className = 'settings-container';

const settingsBtn = document.createElement('div');
settingsBtn.className = 'swatch-btn';
settingsBtn.textContent = '⚙️';
settingsContainer.appendChild(settingsBtn);

// panel
const panel = document.createElement('div');
panel.id = 'settings-panel';
panel.classList.add('hidden');

// slider
const slider = document.createElement('input');
slider.type = 'range';
slider.min = 1; slider.max = 50; slider.value = 3;
panel.appendChild(slider);

// eraser
const eraserBtn = document.createElement('button');
eraserBtn.id = 'eraser-btn';
eraserBtn.title = 'Eraser';
eraserBtn.textContent = '🩹';
panel.appendChild(eraserBtn);

// undo
const undoBtn = document.createElement('button');
undoBtn.id = 'undo-btn';
undoBtn.title = 'Undo';
undoBtn.textContent = '↺';
panel.appendChild(undoBtn);

// redo
const redoBtn = document.createElement('button');
redoBtn.id = 'redo-btn';
redoBtn.title = 'Redo';
redoBtn.textContent = '↻';
panel.appendChild(redoBtn);

settingsContainer.appendChild(panel);
buttonsGrid.appendChild(settingsContainer);

// 2) Export 📥
const exportBtn = document.createElement('div');
exportBtn.id = 'export-btn';
exportBtn.className = 'swatch-btn';
exportBtn.textContent = '📥';
buttonsGrid.appendChild(exportBtn);

// canvas setup
const canvas = document.getElementById('drawing-canvas');
const ctx    = canvas.getContext('2d');
ctx.fillStyle = CANVAS_BG;
ctx.fillRect(0,0,canvas.width,canvas.height);
snapshot();  // seed undo history

// helpers
function snapshot() {
  undoStack.push(canvas.toDataURL());
  redoStack.length = 0;
}
function loadImage(dataURL) {
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(img,0,0);
  };
  img.src = dataURL;
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(canvas.toDataURL());
  loadImage(undoStack.pop());
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(canvas.toDataURL());
  loadImage(redoStack.pop());
}

// interactions
settingsBtn.addEventListener('click', () => panel.classList.toggle('hidden'));
slider.addEventListener('input', e => brushSize = e.target.value);
eraserBtn.addEventListener('click', () => {
  isErasing = !isErasing;
  eraserBtn.style.background = isErasing ? '#bbb' : '#ddd';
});
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);
exportBtn.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'my_doodle.png';
  link.href     = canvas.toDataURL();
  link.click();
});

// drawing logic
function getPos(e) {
  const rect = canvas.getBoundingClientRect(),
        x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
        y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  return { x, y };
}
function startDraw(e) {
  e.preventDefault();
  drawing = true;
  const { x, y } = getPos(e);
  lastX = x; lastY = y;
  snapshot();
}
function draw(e) {
  if (!drawing) return;
  const { x, y } = getPos(e);
  ctx.strokeStyle = isErasing ? CANVAS_BG : currentColor;
  ctx.lineWidth   = brushSize;
  ctx.lineJoin    = 'round';
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();
  lastX = x; lastY = y;
}
function stopDraw() { drawing = false; }

[ 'mousedown','mousemove','mouseup','mouseout' ].forEach((ev) =>
  canvas.addEventListener(ev, { 
    mousedown: startDraw,
    mousemove: draw,
    mouseup:   stopDraw,
    mouseout:  stopDraw
  }[ev])
);
[ 'touchstart','touchmove','touchend' ].forEach((ev) =>
  canvas.addEventListener(ev, { 
    touchstart: startDraw,
    touchmove:  draw,
    touchend:   stopDraw
  }[ev])
);
// prevent context menu on right-click