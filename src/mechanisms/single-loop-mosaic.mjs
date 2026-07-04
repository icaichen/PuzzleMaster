import { analyzeAssembly, generatePiecePlacements, materializePlacement, solvePieceAssembly } from '../kernels/piece-assembly.mjs';

export const singleLoopMosaicMechanism = {
  id: 'ORG-ASM-001',
  version: '1.0.0',
  runtimeKernel: 'PIECE_ASSEMBLY',

  createInitialState(definition) {
    const placements = (definition.runtime.parameters.fixedPlacements ?? []).map(action => materializePlacement(definition.runtime.parameters, action));
    if (placements.some(placement => !placement)) throw new Error('Invalid fixed placement');
    return { placements };
  },

  enumerateActions(state, definition) {
    const placed = new Set(state.placements.map(placement => placement.pieceId));
    const actions = definition.runtime.parameters.pieces.flatMap(piece => placed.has(piece.id) ? []
      : generatePiecePlacements(piece, definition.runtime.parameters.targetCells).map(placement => ({
        type: 'PLACE', pieceId: piece.id, rotation: placement.rotation, offset: placement.offset
      })));
    for (const placement of state.placements) actions.push({ type: 'REMOVE', pieceId: placement.pieceId });
    actions.push({ type: 'RESET' });
    return actions;
  },

  applyAction(state, action, definition) {
    if (action.type === 'RESET') return { ok: true, state: this.createInitialState(definition), events: [{ type: 'RESET' }] };
    if (action.type === 'REMOVE') {
      if ((definition.runtime.parameters.fixedPlacements ?? []).some(placement => placement.pieceId === action.pieceId)) return { ok: false, reason: 'PIECE_FIXED' };
      if (!state.placements.some(placement => placement.pieceId === action.pieceId)) return { ok: false, reason: 'PIECE_NOT_PLACED' };
      return { ok: true, state: { placements: state.placements.filter(placement => placement.pieceId !== action.pieceId) }, events: [{ type: 'PIECE_REMOVED', pieceId: action.pieceId }] };
    }
    if (action.type !== 'PLACE') return { ok: false, reason: 'UNKNOWN_ACTION' };
    if (state.placements.some(placement => placement.pieceId === action.pieceId)) return { ok: false, reason: 'PIECE_ALREADY_PLACED' };
    const placement = materializePlacement(definition.runtime.parameters, action);
    if (!placement) return { ok: false, reason: 'INVALID_PLACEMENT' };
    const occupied = new Set(state.placements.flatMap(existing => existing.cells.map(cell => `${cell.x},${cell.y}`)));
    if (placement.cells.some(cell => occupied.has(`${cell.x},${cell.y}`))) return { ok: false, reason: 'OVERLAP' };
    return { ok: true, state: { placements: [...state.placements, placement] }, events: [{ type: 'PIECE_PLACED', pieceId: action.pieceId }] };
  },

  isGoal(state, definition) {
    return analyzeAssembly(definition.runtime.parameters, state.placements).valid;
  },

  isFailure() { return false; },

  hashState(state) {
    return state.placements.map(placement => placement.key).sort().join('|') || 'EMPTY';
  },

  explain(state, definition) {
    return analyzeAssembly(definition.runtime.parameters, state.placements);
  },

  solve(definition, options) {
    return solvePieceAssembly(definition.runtime.parameters, options);
  }
};
