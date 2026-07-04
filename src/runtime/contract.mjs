import { deepClone, deepFreeze, stableStringify } from './value-utils.mjs';

const REQUIRED_METHODS = [
  'createInitialState',
  'enumerateActions',
  'applyAction',
  'isGoal',
  'isFailure',
  'hashState',
  'explain'
];

export function assertMechanismContract(mechanism) {
  if (!mechanism || typeof mechanism !== 'object') throw new TypeError('Mechanism must be an object');
  for (const method of REQUIRED_METHODS) {
    if (typeof mechanism[method] !== 'function') throw new TypeError(`Mechanism is missing method: ${method}`);
  }
  if (!mechanism.id || !mechanism.version || !mechanism.runtimeKernel) {
    throw new TypeError('Mechanism must declare id, version and runtimeKernel');
  }
}

export class PuzzleRuntime {
  constructor(definition, mechanism) {
    assertMechanismContract(mechanism);
    if (definition.identity.mechanismId !== mechanism.id) throw new Error('Definition mechanismId does not match implementation');
    if (definition.identity.mechanismVersion !== mechanism.version) throw new Error('Definition mechanismVersion does not match implementation');
    if (definition.identity.runtimeKernel !== mechanism.runtimeKernel) throw new Error('Definition runtimeKernel does not match implementation');
    this.definition = deepFreeze(deepClone(definition));
    this.mechanism = mechanism;
  }

  createInitialState() {
    return deepClone(this.mechanism.createInitialState(this.definition));
  }

  enumerateActions(state) {
    const before = stableStringify(state);
    const actions = this.mechanism.enumerateActions(deepFreeze(deepClone(state)), this.definition);
    if (stableStringify(state) !== before) throw new Error('enumerateActions mutated input state');
    if (!Array.isArray(actions)) throw new TypeError('enumerateActions must return an array');
    return deepClone(actions);
  }

  applyAction(state, action) {
    const before = stableStringify(state);
    const frozenState = deepFreeze(deepClone(state));
    const first = this.mechanism.applyAction(frozenState, deepFreeze(deepClone(action)), this.definition);
    const second = this.mechanism.applyAction(frozenState, deepFreeze(deepClone(action)), this.definition);
    if (stableStringify(state) !== before) throw new Error('applyAction mutated input state');
    if (stableStringify(first) !== stableStringify(second)) throw new Error('applyAction is not deterministic');
    if (!first || typeof first.ok !== 'boolean') throw new TypeError('applyAction must return {ok,...}');
    return deepClone(first);
  }

  status(state) {
    return {
      goal: Boolean(this.mechanism.isGoal(state, this.definition)),
      failure: Boolean(this.mechanism.isFailure(state, this.definition))
    };
  }

  hashState(state) {
    const hash = this.mechanism.hashState(state, this.definition);
    if (typeof hash !== 'string' || !hash) throw new TypeError('hashState must return a non-empty string');
    return hash;
  }

  replay(actions) {
    let state = this.createInitialState();
    const events = [];
    for (const action of actions) {
      const result = this.applyAction(state, action);
      if (!result.ok) return { ok: false, state, reason: result.reason, events };
      state = result.state;
      events.push(...(result.events ?? []));
    }
    return { ok: true, state, status: this.status(state), events };
  }
}

