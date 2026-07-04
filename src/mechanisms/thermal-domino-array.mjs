import { analyzeThermalDominoes, generateThermalDominoCandidates, solveThermalDominoes } from '../kernels/grid-placement.mjs';

export const thermalDominoArrayMechanism = {
  id: 'ORG-GRD-001', version: '1.0.0', runtimeKernel: 'GRID_PLACEMENT',
  createInitialState(definition) { return { selectedIds: [...(definition.runtime.parameters.fixedCandidateIds ?? [])] }; },
  enumerateActions(state, definition) {
    const actions = generateThermalDominoCandidates(definition.runtime.parameters)
      .filter(candidate => !state.selectedIds.includes(candidate.id))
      .map(candidate => ({ type: 'PLACE', candidateId: candidate.id }));
    for (const id of state.selectedIds) if (!(definition.runtime.parameters.fixedCandidateIds ?? []).includes(id)) actions.push({ type: 'REMOVE', candidateId: id });
    actions.push({ type: 'RESET' });
    return actions;
  },
  applyAction(state, action, definition) {
    const fixed = definition.runtime.parameters.fixedCandidateIds ?? [];
    if (action.type === 'RESET') return { ok: true, state: this.createInitialState(definition), events: [{ type: 'RESET' }] };
    if (action.type === 'REMOVE') {
      if (fixed.includes(action.candidateId)) return { ok: false, reason: 'CANDIDATE_FIXED' };
      if (!state.selectedIds.includes(action.candidateId)) return { ok: false, reason: 'CANDIDATE_NOT_PLACED' };
      return { ok: true, state: { selectedIds: state.selectedIds.filter(id => id !== action.candidateId) }, events: [{ type: 'CANDIDATE_REMOVED' }] };
    }
    if (action.type !== 'PLACE') return { ok: false, reason: 'UNKNOWN_ACTION' };
    const map = new Map(generateThermalDominoCandidates(definition.runtime.parameters).map(candidate => [candidate.id, candidate]));
    const candidate = map.get(action.candidateId);
    if (!candidate) return { ok: false, reason: 'UNKNOWN_CANDIDATE' };
    if (state.selectedIds.includes(candidate.id)) return { ok: false, reason: 'CANDIDATE_ALREADY_PLACED' };
    const occupied = new Set(state.selectedIds.flatMap(id => map.get(id).cells.map(cell => `${cell.x},${cell.y}`)));
    if (candidate.cells.some(cell => occupied.has(`${cell.x},${cell.y}`))) return { ok: false, reason: 'OVERLAP' };
    return { ok: true, state: { selectedIds: [...state.selectedIds, candidate.id] }, events: [{ type: 'CANDIDATE_PLACED', candidateId: candidate.id }] };
  },
  isGoal(state, definition) { return analyzeThermalDominoes(definition.runtime.parameters, state.selectedIds).valid; },
  isFailure() { return false; },
  hashState(state) { return [...state.selectedIds].sort().join('|') || 'EMPTY'; },
  explain(state, definition) { return analyzeThermalDominoes(definition.runtime.parameters, state.selectedIds); },
  solve(definition, options) { return solveThermalDominoes(definition.runtime.parameters, options); }
};
