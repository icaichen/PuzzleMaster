const DIRECTIONS = {
  N: { x: 0, y: -1, opposite: 'S' },
  E: { x: 1, y: 0, opposite: 'W' },
  S: { x: 0, y: 1, opposite: 'N' },
  W: { x: -1, y: 0, opposite: 'E' }
};
const ROTATE_DIRECTION = { N: 'E', E: 'S', S: 'W', W: 'N' };
const cellKey = ({ x, y }) => `${x},${y}`;

function rotatePoint({ x, y }) {
  return { x: -y, y: x };
}

function normalizeCells(cells) {
  const minX = Math.min(...cells.map(cell => cell.x));
  const minY = Math.min(...cells.map(cell => cell.y));
  return cells.map(cell => ({
    ...cell,
    x: cell.x - minX,
    y: cell.y - minY,
    ports: [...(cell.ports ?? [])].sort()
  })).sort((a, b) => a.y - b.y || a.x - b.x);
}

export function transformPiece(piece, quarterTurns) {
  let cells = piece.cells.map(cell => ({ ...cell, ports: [...(cell.ports ?? [])] }));
  for (let turn = 0; turn < quarterTurns; turn++) {
    cells = cells.map(cell => {
      const point = rotatePoint(cell);
      return { ...point, ports: cell.ports.map(direction => ROTATE_DIRECTION[direction]) };
    });
  }
  return normalizeCells(cells);
}

export function enumerateUniqueTransforms(piece) {
  const transforms = [];
  const seen = new Set();
  for (let rotation = 0; rotation < 4; rotation++) {
    const cells = transformPiece(piece, rotation);
    const signature = cells.map(cell => `${cell.x},${cell.y}:${cell.ports.join('')}`).join('|');
    if (!seen.has(signature)) {
      seen.add(signature);
      transforms.push({ rotation, key: `R${rotation * 90}`, cells });
    }
  }
  return transforms;
}

export function generatePiecePlacements(piece, targetCells) {
  const target = new Set(targetCells.map(cellKey));
  const placements = [];
  for (const transform of enumerateUniqueTransforms(piece)) {
    for (const targetCell of targetCells) {
      for (const sourceCell of transform.cells) {
        const offset = { x: targetCell.x - sourceCell.x, y: targetCell.y - sourceCell.y };
        const cells = transform.cells.map(cell => ({ ...cell, x: cell.x + offset.x, y: cell.y + offset.y }));
        if (!cells.every(cell => target.has(cellKey(cell)))) continue;
        const key = `${piece.id}:${transform.key}@${offset.x},${offset.y}`;
        if (!placements.some(placement => placement.key === key)) {
          placements.push({ key, pieceId: piece.id, rotation: transform.rotation, offset, cells });
        }
      }
    }
  }
  return placements.sort((a, b) => a.key.localeCompare(b.key));
}

export function analyzeAssembly(parameters, selectedPlacements) {
  const target = new Set(parameters.targetCells.map(cellKey));
  const occupied = new Map();
  const errors = [];
  for (const placement of selectedPlacements) {
    for (const cell of placement.cells) {
      const key = cellKey(cell);
      if (!target.has(key)) errors.push({ type: 'OUTSIDE_TARGET', pieceId: placement.pieceId, cell: key });
      if (occupied.has(key)) errors.push({ type: 'OVERLAP', pieces: [occupied.get(key).pieceId, placement.pieceId], cell: key });
      occupied.set(key, { ...cell, pieceId: placement.pieceId });
    }
  }

  const graph = new Map([...occupied.keys()].map(key => [key, new Set()]));
  for (const [key, cell] of occupied) {
    const ports = new Set(cell.ports ?? []);
    for (const [direction, delta] of Object.entries(DIRECTIONS)) {
      const neighborKey = `${cell.x + delta.x},${cell.y + delta.y}`;
      const neighbor = occupied.get(neighborKey);
      if (!target.has(neighborKey)) {
        if (ports.has(direction)) errors.push({ type: 'OPEN_BOUNDARY_PORT', cell: key, direction });
        continue;
      }
      if (!neighbor) continue;
      const matched = ports.has(direction) === new Set(neighbor.ports ?? []).has(delta.opposite);
      if (!matched) errors.push({ type: 'PORT_MISMATCH', cells: [key, neighborKey] });
      if (ports.has(direction) && matched) graph.get(key).add(neighborKey);
    }
  }

  let connectedChannel = false;
  if (occupied.size) {
    const channelNodes = [...graph].filter(([, neighbors]) => neighbors.size > 0).map(([key]) => key);
    if (channelNodes.length) {
      const visited = new Set([channelNodes[0]]);
      const queue = [channelNodes[0]];
      while (queue.length) {
        for (const neighbor of graph.get(queue.shift())) {
          if (!visited.has(neighbor)) { visited.add(neighbor); queue.push(neighbor); }
        }
      }
      connectedChannel = visited.size === occupied.size;
    }
  }
  const singleLoop = connectedChannel && [...graph.values()].every(neighbors => neighbors.size === 2);
  const allPiecesUsed = selectedPlacements.length === parameters.pieces.length
    && new Set(selectedPlacements.map(placement => placement.pieceId)).size === parameters.pieces.length;
  const fullCoverage = occupied.size === target.size && [...target].every(key => occupied.has(key));
  return { valid: errors.length === 0 && allPiecesUsed && fullCoverage && singleLoop, errors, allPiecesUsed, fullCoverage, singleLoop };
}

function placementsCompatible(candidate, selected, targetSet) {
  const occupied = new Map(selected.flatMap(placement => placement.cells.map(cell => [cellKey(cell), cell])));
  for (const cell of candidate.cells) {
    const key = cellKey(cell);
    if (occupied.has(key)) return false;
    const ports = new Set(cell.ports ?? []);
    for (const [direction, delta] of Object.entries(DIRECTIONS)) {
      const neighborKey = `${cell.x + delta.x},${cell.y + delta.y}`;
      if (!targetSet.has(neighborKey) && ports.has(direction)) return false;
      const neighbor = occupied.get(neighborKey);
      if (neighbor && ports.has(direction) !== new Set(neighbor.ports ?? []).has(delta.opposite)) return false;
    }
  }
  return true;
}

export function solvePieceAssembly(parameters, { maxSolutions = Infinity, requireChannel = true } = {}) {
  const activeParameters = requireChannel ? parameters : {
    ...parameters,
    pieces: parameters.pieces.map(piece => ({ ...piece, cells: piece.cells.map(cell => ({ ...cell, ports: [] })) }))
  };
  const placementMap = new Map(activeParameters.pieces.map(piece => [piece.id, generatePiecePlacements(piece, activeParameters.targetCells)]));
  const targetSet = new Set(activeParameters.targetCells.map(cellKey));
  const solutions = [];
  let nodesVisited = 0;
  const fixedPlacements = (activeParameters.fixedPlacements ?? []).map(action => materializePlacement(activeParameters, action));
  if (fixedPlacements.some(placement => !placement)) throw new Error('Invalid fixed placement');

  function visit(selected, remaining) {
    if (solutions.length >= maxSolutions) return;
    nodesVisited++;
    if (!remaining.length) {
      const analysis = analyzeAssembly(activeParameters, selected);
      if (analysis.errors.length === 0 && analysis.allPiecesUsed && analysis.fullCoverage && (!requireChannel || analysis.singleLoop)) {
        solutions.push(selected.map(({ key, pieceId, rotation, offset }) => ({ key, pieceId, rotation, offset })));
      }
      return;
    }
    const options = remaining.map(pieceId => ({ pieceId, placements: placementMap.get(pieceId).filter(placement => placementsCompatible(placement, selected, targetSet)) }))
      .sort((a, b) => a.placements.length - b.placements.length || a.pieceId.localeCompare(b.pieceId));
    const next = options[0];
    for (const placement of next.placements) visit([...selected, placement], remaining.filter(id => id !== next.pieceId));
  }

  visit(fixedPlacements, activeParameters.pieces.map(piece => piece.id).filter(id => !fixedPlacements.some(placement => placement.pieceId === id)));
  return { solutions, nodesVisited };
}

export function materializePlacement(parameters, action) {
  const piece = parameters.pieces.find(candidate => candidate.id === action.pieceId);
  if (!piece) return null;
  return generatePiecePlacements(piece, parameters.targetCells).find(placement => placement.rotation === action.rotation
    && placement.offset.x === action.offset?.x && placement.offset.y === action.offset?.y) ?? null;
}
