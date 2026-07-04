import { PuzzleRuntime } from '../src/runtime/contract.mjs';
import { enumerateUniqueTransforms, generatePiecePlacements } from '../src/kernels/piece-assembly.mjs';
import { singleLoopMosaicMechanism } from '../src/mechanisms/single-loop-mosaic.mjs';

const definition = await fetch('../examples/riveted-circuit-mosaic.puzzle.json').then(response => response.json());
const runtime = new PuzzleRuntime(definition, singleLoopMosaicMechanism);
const parameters = definition.runtime.parameters;
let state = runtime.createInitialState();
let selectedPiece = null;
let rotationIndex = 0;
const query = selector => document.querySelector(selector);

function placeAt(x, y) {
  if (!selectedPiece) return setFeedback('请先选择一块碎片。', 'error');
  const piece = parameters.pieces.find(item => item.id === selectedPiece);
  const transforms = enumerateUniqueTransforms(piece);
  const rotation = transforms[rotationIndex % transforms.length].rotation;
  const occupied = new Set(state.placements.flatMap(placement => placement.cells.map(cell => `${cell.x},${cell.y}`)));
  const compatible = generatePiecePlacements(piece, parameters.targetCells).filter(placement => placement.rotation === rotation
    && placement.cells.some(cell => cell.x === x && cell.y === y)
    && placement.cells.every(cell => !occupied.has(`${cell.x},${cell.y}`)));
  if (compatible.length !== 1) return setFeedback(compatible.length ? '这个格子对应多个可能位置，请点碎片更靠边的格子。' : '当前方向无法覆盖这个格子。', 'error');
  const placement = compatible[0];
  const result = runtime.applyAction(state, { type: 'PLACE', pieceId: selectedPiece, rotation, offset: placement.offset });
  if (!result.ok) return setFeedback(result.reason === 'OVERLAP' ? '该位置与已有碎片重叠。' : '碎片在这里会越出框架。', 'error');
  state = result.state;
  setFeedback(`已放置 ${selectedPiece}。`);
  selectedPiece = null;
  rotationIndex = 0;
  render();
}

function setFeedback(text, kind = '') {
  query('#feedback').className = `feedback ${kind}`.trim();
  query('#feedback').textContent = text;
}

function render() {
  query('#mosaic').replaceChildren();
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) {
    const placed = state.placements.find(item => item.cells.some(cell => cell.x === x && cell.y === y));
    const occupiedCell = placed?.cells.find(cell => cell.x === x && cell.y === y);
    const element = document.createElement('button');
    element.type = 'button';
    element.className = `mosaic-cell ${placed ? 'filled' : ''} ${placed?.pieceId === 'P1' ? 'fixed' : ''}`;
    element.dataset.cell = `${x},${y}`;
    if (occupiedCell) {
      element.innerHTML = `<small>${placed.pieceId}</small><span class="ports">${occupiedCell.ports.map(port => `<i class="port ${port}"></i>`).join('')}</span>`;
      element.setAttribute('aria-label', `${placed.pieceId} 已占用`);
      if (placed.pieceId !== 'P1') element.onclick = () => {
        state = runtime.applyAction(state, { type: 'REMOVE', pieceId: placed.pieceId }).state;
        setFeedback(`已移除 ${placed.pieceId}。`);
        render();
      };
    } else {
      element.setAttribute('aria-label', `空格 ${x},${y}，点击让所选碎片覆盖此格`);
      element.onclick = () => placeAt(x, y);
    }
    query('#mosaic').append(element);
  }
  query('#pieces').replaceChildren();
  for (const piece of parameters.pieces.filter(piece => !state.placements.some(placement => placement.pieceId === piece.id))) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `piece-card ${selectedPiece === piece.id ? 'selected' : ''}`;
    card.dataset.piece = piece.id;
    const transforms = enumerateUniqueTransforms(piece);
    const rotation = selectedPiece === piece.id ? transforms[rotationIndex % transforms.length].rotation * 90 : 0;
    card.innerHTML = `<h3>${piece.id}</h3><small>${selectedPiece === piece.id ? `旋转 ${rotation}°` : '点击选择'}</small>`;
    card.onclick = () => { selectedPiece = piece.id; rotationIndex = 0; setFeedback(`已选择 ${piece.id}，可旋转或点击落点。`); render(); };
    query('#pieces').append(card);
  }
}

query('#rotate').onclick = () => {
  if (!selectedPiece) return setFeedback('请先选择一块碎片。', 'error');
  const piece = parameters.pieces.find(item => item.id === selectedPiece);
  rotationIndex = (rotationIndex + 1) % enumerateUniqueTransforms(piece).length;
  render();
};
query('#reset').onclick = () => { state = runtime.createInitialState(); selectedPiece = null; rotationIndex = 0; setFeedback('已重置。'); render(); };
query('#submit').onclick = () => {
  const goal = runtime.status(state).goal;
  setFeedback(goal ? '轮廓和单环均正确。' : '仍有空格、端口断裂或多个回路。', goal ? 'success' : 'error');
};
render();
