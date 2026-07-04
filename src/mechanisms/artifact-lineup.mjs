import { createVariableMap, evaluateConstraints, solveCsp } from '../kernels/csp-assignment.mjs';

export const artifactLineupMechanism = {
  id: 'ORG-LOG-001',
  version: '1.0.0',
  runtimeKernel: 'CSP_ASSIGNMENT',

  createInitialState(definition) {
    return { assignments: { ...(definition.runtime.initialState.assignments ?? {}) } };
  },

  enumerateActions(state, definition) {
    const actions = [];
    for (const variable of definition.runtime.parameters.variables) {
      for (const value of variable.domain) actions.push({ type: 'PLACE', variable: variable.id, value });
      if (Object.prototype.hasOwnProperty.call(state.assignments, variable.id)) actions.push({ type: 'CLEAR', variable: variable.id });
    }
    return actions;
  },

  applyAction(state, action, definition) {
    const variables = createVariableMap(definition.runtime.parameters.variables);
    if (!variables.has(action.variable)) return { ok: false, reason: 'UNKNOWN_VARIABLE' };
    const assignments = { ...state.assignments };
    if (action.type === 'CLEAR') {
      delete assignments[action.variable];
      return { ok: true, state: { assignments }, events: [{ type: 'CLEARED', variable: action.variable }] };
    }
    if (action.type !== 'PLACE') return { ok: false, reason: 'UNKNOWN_ACTION' };
    if (!variables.get(action.variable).domain.includes(action.value)) return { ok: false, reason: 'VALUE_OUT_OF_DOMAIN' };

    for (const [variable, value] of Object.entries(assignments)) {
      if (variable !== action.variable && value === action.value) delete assignments[variable];
    }
    assignments[action.variable] = action.value;
    return {
      ok: true,
      state: { assignments },
      events: [{ type: 'PLACED', variable: action.variable, value: action.value }]
    };
  },

  isGoal(state, definition) {
    const variables = createVariableMap(definition.runtime.parameters.variables);
    const evaluation = evaluateConstraints(definition.runtime.parameters.constraints, state.assignments, variables);
    return Object.keys(state.assignments).length === variables.size && evaluation.complete;
  },

  isFailure() {
    return false;
  },

  hashState(state) {
    return Object.entries(state.assignments).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${value}`).join('|');
  },

  explain(solution) {
    return Object.entries(solution).sort(([, a], [, b]) => a - b).map(([variable, value]) => ({ variable, value }));
  },

  solve(definition, options) {
    return solveCsp(definition.runtime.parameters, options);
  }
};

