const key = point => `${point.x},${point.y}`;

export function generateThermalDominoCandidates(parameters) {
  const candidates = [];
  let index = 0;
  for (let y = 0; y < parameters.height; y++) {
    for (let x = 0; x < parameters.width; x++) {
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        const end = { x: x + dx, y: y + dy };
        if (end.x >= parameters.width || end.y >= parameters.height) continue;
        const start = { x, y };
        for (const hotEnd of [0, 1]) {
          candidates.push({
            id: `D${String(index++).padStart(2, '0')}`,
            cells: [start, end],
            hot: hotEnd === 0 ? start : end,
            vertical: dy === 1
          });
        }
      }
    }
  }
  return candidates;
}

export function analyzeThermalDominoes(parameters, selectedIds, options = {}) {
  const requireNonAdjacent = options.requireNonAdjacent ?? true;
  const requireVerticalTarget = options.requireVerticalTarget ?? true;
  const candidateMap = new Map(generateThermalDominoCandidates(parameters).map(candidate => [candidate.id, candidate]));
  const selected = selectedIds.map(id => candidateMap.get(id));
  const errors = [];
  if (selected.some(candidate => !candidate)) errors.push({ type: 'UNKNOWN_CANDIDATE' });
  if (new Set(selectedIds).size !== selectedIds.length) errors.push({ type: 'DUPLICATE_CANDIDATE' });
  const occupied = new Map();
  for (const candidate of selected.filter(Boolean)) {
    for (const cell of candidate.cells) {
      const cellId = key(cell);
      if (occupied.has(cellId)) errors.push({ type: 'OVERLAP', cell: cellId });
      occupied.set(cellId, candidate.id);
    }
  }
  const hot = new Set(selected.filter(Boolean).map(candidate => key(candidate.hot)));
  if (requireNonAdjacent) {
    for (const candidate of selected.filter(Boolean)) {
      const point = candidate.hot;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => hot.has(`${point.x + dx},${point.y + dy}`))) {
        errors.push({ type: 'ADJACENT_HOT_ENDS', cell: key(point) });
      }
    }
  }
  const verticalCount = selected.filter(candidate => candidate?.vertical).length;
  if (requireVerticalTarget && verticalCount !== parameters.verticalTarget) errors.push({ type: 'VERTICAL_COUNT', actual: verticalCount });
  const fullCoverage = occupied.size === parameters.width * parameters.height;
  if (!fullCoverage) errors.push({ type: 'INCOMPLETE_COVERAGE' });
  const fixedIncluded = (parameters.fixedCandidateIds ?? []).every(id => selectedIds.includes(id));
  if (!fixedIncluded) errors.push({ type: 'FIXED_CANDIDATE_MISSING' });
  return { valid: errors.length === 0, errors, fullCoverage, fixedIncluded, verticalCount };
}

export function solveThermalDominoes(parameters, options = {}) {
  const candidates = generateThermalDominoCandidates(parameters);
  const byId = new Map(candidates.map(candidate => [candidate.id, candidate]));
  const fixed = (parameters.fixedCandidateIds ?? []).map(id => byId.get(id));
  if (fixed.some(candidate => !candidate)) throw new Error('Invalid fixed candidate');
  const solutions = [];
  let nodesVisited = 0;

  function visit(selected, occupied) {
    if (solutions.length >= (options.maxSolutions ?? Infinity)) return;
    nodesVisited++;
    if (occupied.size === parameters.width * parameters.height) {
      const ids = selected.map(candidate => candidate.id).sort();
      if (analyzeThermalDominoes(parameters, ids, options).valid) solutions.push(ids);
      return;
    }
    let first;
    for (let y = 0; y < parameters.height && !first; y++) {
      for (let x = 0; x < parameters.width; x++) {
        if (!occupied.has(`${x},${y}`)) { first = `${x},${y}`; break; }
      }
    }
    for (const candidate of candidates) {
      if (!candidate.cells.some(cell => key(cell) === first)) continue;
      const cells = candidate.cells.map(key);
      if (cells.some(cell => occupied.has(cell))) continue;
      const nextSelected = [...selected, candidate];
      if ((options.requireVerticalTarget ?? true) && nextSelected.filter(item => item.vertical).length > parameters.verticalTarget) continue;
      if (options.requireNonAdjacent ?? true) {
        const existingHot = new Set(selected.map(item => key(item.hot)));
        const point = candidate.hot;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => existingHot.has(`${point.x + dx},${point.y + dy}`))) continue;
      }
      visit(nextSelected, new Set([...occupied, ...cells]));
    }
  }

  const fixedOccupied = new Set(fixed.flatMap(candidate => candidate.cells.map(key)));
  if (fixedOccupied.size !== fixed.length * 2) return { solutions: [], nodesVisited: 0 };
  visit(fixed, fixedOccupied);
  return { solutions, nodesVisited };
}
