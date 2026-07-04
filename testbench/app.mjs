import { PuzzleRuntime } from '../src/runtime/contract.mjs';
import { generateThermalDominoCandidates } from '../src/kernels/grid-placement.mjs';
import { thermalDominoArrayMechanism } from '../src/mechanisms/thermal-domino-array.mjs';

const definition = await fetch('../examples/thermal-domino-array.puzzle.json').then(response => response.json());
const runtime = new PuzzleRuntime(definition, thermalDominoArrayMechanism);
const candidates = generateThermalDominoCandidates(definition.runtime.parameters);
const candidateMap = new Map(candidates.map(candidate => [candidate.id, candidate]));
const fixed = new Set(definition.runtime.parameters.fixedCandidateIds);
let state = runtime.createInitialState();
let pendingHot = null;
let history = [];

const board = document.querySelector('#board');
const feedback = document.querySelector('#feedback');
const instruction = document.querySelector('#instruction');
const cellKey = point => `${point.x},${point.y}`;

for (let y = 0; y < definition.runtime.parameters.height; y++) {
  for (let x = 0; x < definition.runtime.parameters.width; x++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell';
    button.dataset.cell = `${x},${y}`;
    button.setAttribute('role', 'gridcell');
    button.addEventListener('click', () => handleCell({ x, y }));
    board.append(button);
  }
}

function occupantAt(point) {
  return state.selectedIds.map(id => candidateMap.get(id)).find(candidate => candidate.cells.some(cell => cellKey(cell) === cellKey(point)));
}

function setFeedback(text, kind = '') {
  feedback.textContent = text;
  feedback.className = `feedback ${kind}`.trim();
}

function handleCell(point) {
  const occupant = occupantAt(point);
  if (occupant) {
    if (fixed.has(occupant.id)) return setFeedback('这块骨牌带有蓝色卡扣，不能移动。', 'error');
    history.push(structuredClone(state));
    state = runtime.applyAction(state, { type: 'REMOVE', candidateId: occupant.id }).state;
    pendingHot = null;
    setFeedback('已移除一块骨牌。');
    return render();
  }
  if (!pendingHot) {
    pendingHot = point;
    setFeedback('热端已选定，请点击一个相邻空格作为冷端。');
    return render();
  }
  if (cellKey(pendingHot) === cellKey(point)) {
    pendingHot = null;
    setFeedback('已取消热端选择。');
    return render();
  }
  const candidate = candidates.find(item => cellKey(item.hot) === cellKey(pendingHot)
    && item.cells.some(cell => cellKey(cell) === cellKey(point)));
  if (!candidate) {
    pendingHot = point;
    setFeedback('骨牌两端必须上下或左右相邻；已改选当前格为热端。', 'error');
    return render();
  }
  history.push(structuredClone(state));
  const result = runtime.applyAction(state, { type: 'PLACE', candidateId: candidate.id });
  if (!result.ok) {
    history.pop();
    setFeedback('该位置与已有骨牌重叠。', 'error');
  } else {
    state = result.state;
    setFeedback('骨牌已放置。继续选择下一块的热端。');
  }
  pendingHot = null;
  render();
}

function render() {
  const selected = state.selectedIds.map(id => candidateMap.get(id));
  const hotCells = new Set(selected.map(candidate => cellKey(candidate.hot)));
  const violationCells = new Set();
  for (const candidate of selected) {
    const point = candidate.hot;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const neighbor = `${point.x + dx},${point.y + dy}`;
      if (hotCells.has(neighbor)) { violationCells.add(cellKey(point)); violationCells.add(neighbor); }
    }
  }
  document.querySelectorAll('.cell').forEach(cell => {
    const point = cell.dataset.cell;
    const occupant = selected.find(candidate => candidate.cells.some(part => cellKey(part) === point));
    cell.className = 'cell';
    cell.replaceChildren();
    if (pendingHot && point === cellKey(pendingHot)) cell.classList.add('pending');
    if (violationCells.has(point)) cell.classList.add('violation');
    if (occupant) {
      const isHot = cellKey(occupant.hot) === point;
      cell.classList.add(isHot ? 'hot-cell' : 'cold-cell');
      const label = document.createElement('span');
      label.className = 'temperature';
      label.textContent = isHot ? '热' : '冷';
      const id = document.createElement('span'); id.className = 'piece-id'; id.textContent = occupant.id;
      cell.append(label, id);
      if (fixed.has(occupant.id)) { const rivet = document.createElement('i'); rivet.className = 'rivet'; cell.append(rivet); }
      cell.setAttribute('aria-label', `${point}，${isHot ? '热端' : '冷端'}${fixed.has(occupant.id) ? '，固定骨牌' : '，点击移除骨牌'}`);
    } else {
      cell.setAttribute('aria-label', `${point}，空格${pendingHot ? '，点击设为冷端' : '，点击设为热端'}`);
    }
  });
  const occupied = selected.length * 2;
  const vertical = selected.filter(candidate => candidate.vertical).length;
  document.querySelector('#fill-status').textContent = `${occupied} / 12 格`;
  document.querySelector('#vertical-status').textContent = `${vertical} / ${definition.runtime.parameters.verticalTarget}`;
  document.querySelector('#adjacency-status').textContent = `${violationCells.size / 2} 处`;
  document.querySelector('#coverage-status').textContent = occupied === 12 ? '已铺满' : '未完成';
  instruction.textContent = pendingHot ? '请选择相邻空格作为冷端' : '请选择一个空格作为热端';
}

document.querySelector('#undo').addEventListener('click', () => {
  if (!history.length) return setFeedback('当前没有可撤销的操作。');
  state = history.pop(); pendingHot = null; setFeedback('已撤销上一步。'); render();
});
document.querySelector('#reset').addEventListener('click', () => {
  history = []; pendingHot = null; state = runtime.createInitialState(); setFeedback('已恢复到固定骨牌的初始状态。'); render();
});
document.querySelector('#submit').addEventListener('click', () => {
  const status = runtime.status(state);
  if (status.goal) return setFeedback('完成：阵列完整，热端彼此隔离，竖放数量正确。', 'success');
  const selected = state.selectedIds.map(id => candidateMap.get(id));
  if (selected.length < 6) return setFeedback('阵列还没有铺满。', 'error');
  if (selected.filter(candidate => candidate.vertical).length !== definition.runtime.parameters.verticalTarget) return setFeedback('竖放骨牌数量不正确。', 'error');
  setFeedback('存在上下左右相邻的热端。', 'error');
});
document.querySelector('#rules-toggle').addEventListener('click', event => {
  const panel = document.querySelector('#rules-panel');
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute('aria-expanded', String(!panel.hidden));
});

render();
