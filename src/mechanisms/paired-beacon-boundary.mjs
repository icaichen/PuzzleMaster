import { evaluateRegionRules, solveLineRegion, wouldCreateIntersection } from '../kernels/line-region-geometry.mjs';

export const pairedBeaconBoundaryMechanism = {
  id: 'ORG-GEO-001',
  version: '1.0.0',
  runtimeKernel: 'LINE_REGION_GEOMETRY',

  createInitialState(definition) {
    return { order: [...(definition.runtime.initialState.order ?? [])], closed: false };
  },

  enumerateActions(state, definition) {
    if (state.closed) return [{ type: 'RESET' }];
    const used = new Set(state.order);
    const actions = definition.runtime.parameters.anchors
      .filter(anchor => !used.has(anchor.id))
      .map(anchor => ({ type: 'ADD_ANCHOR', anchorId: anchor.id }));
    if (state.order.length === definition.runtime.parameters.anchors.length) actions.push({ type: 'CLOSE' });
    if (state.order.length) actions.push({ type: 'REMOVE_LAST' });
    actions.push({ type: 'RESET' });
    return actions;
  },

  applyAction(state, action, definition) {
    if (action.type === 'RESET') return { ok: true, state: { order: [], closed: false }, events: [{ type: 'RESET' }] };
    if (state.closed) return { ok: false, reason: 'BOUNDARY_ALREADY_CLOSED' };
    if (action.type === 'REMOVE_LAST') {
      if (!state.order.length) return { ok: false, reason: 'EMPTY_PATH' };
      return { ok: true, state: { order: state.order.slice(0, -1), closed: false }, events: [{ type: 'ANCHOR_REMOVED' }] };
    }
    const anchorMap = new Map(definition.runtime.parameters.anchors.map(anchor => [anchor.id, anchor]));
    if (action.type === 'ADD_ANCHOR') {
      if (!anchorMap.has(action.anchorId)) return { ok: false, reason: 'UNKNOWN_ANCHOR' };
      if (state.order.includes(action.anchorId)) return { ok: false, reason: 'ANCHOR_ALREADY_USED' };
      const points = state.order.map(id => anchorMap.get(id));
      if (wouldCreateIntersection(points, anchorMap.get(action.anchorId))) return { ok: false, reason: 'SELF_INTERSECTION' };
      return { ok: true, state: { order: [...state.order, action.anchorId], closed: false }, events: [{ type: 'ANCHOR_ADDED', anchorId: action.anchorId }] };
    }
    if (action.type === 'CLOSE') {
      if (state.order.length !== anchorMap.size) return { ok: false, reason: 'UNUSED_ANCHORS' };
      const points = state.order.map(id => anchorMap.get(id));
      if (wouldCreateIntersection(points, points[0], true)) return { ok: false, reason: 'SELF_INTERSECTION' };
      return { ok: true, state: { order: [...state.order], closed: true }, events: [{ type: 'BOUNDARY_CLOSED' }] };
    }
    return { ok: false, reason: 'UNKNOWN_ACTION' };
  },

  isGoal(state, definition) {
    return state.closed && evaluateRegionRules(state.order, definition.runtime.parameters).valid;
  },

  isFailure() {
    return false;
  },

  hashState(state) {
    return `${state.closed ? 'C' : 'O'}:${state.order.join('>')}`;
  },

  explain(order, definition) {
    return evaluateRegionRules(order, definition.runtime.parameters);
  },

  solve(definition, options) {
    return solveLineRegion(definition.runtime.parameters, options);
  }
};
