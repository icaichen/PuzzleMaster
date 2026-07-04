import { breadthFirstSolve } from '../runtime/breadth-first-solver.mjs';
import { PuzzleRuntime } from '../runtime/contract.mjs';
import { carrierPosition, carriersAtStation, schedulePeriod } from '../kernels/time-expanded-route.mjs';

export const movingCarrierTransferMechanism = {
  id: 'ORG-NAV-003',
  version: '1.0.0',
  runtimeKernel: 'TIME_EXPANDED_ROUTE',

  createInitialState(definition) {
    const { parameters } = definition.runtime;
    const carrier = parameters.carriers.find(item => item.id === parameters.startCarrier);
    if (!carrier) throw new Error('Start carrier does not exist');
    if (carrierPosition(carrier, 0) !== parameters.startStation) throw new Error('Start carrier is not at the start station on tick 0');
    return { tick: 0, carrierId: carrier.id, transferCount: 0 };
  },

  enumerateActions(state, definition) {
    const { carriers } = definition.runtime.parameters;
    const currentCarrier = carriers.find(carrier => carrier.id === state.carrierId);
    const station = carrierPosition(currentCarrier, state.tick);
    const transfers = carriersAtStation(carriers, station, state.tick)
      .filter(carrier => carrier.id !== state.carrierId)
      .map(carrier => ({ type: 'TRANSFER', carrierId: carrier.id }));
    return [{ type: 'WAIT' }, ...transfers].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  },

  applyAction(state, action, definition) {
    const { carriers, turnLimit } = definition.runtime.parameters;
    if (state.tick >= turnLimit) return { ok: false, reason: 'TURN_LIMIT' };
    let carrierId = state.carrierId;
    let transferCount = state.transferCount;

    if (action.type === 'TRANSFER') {
      const current = carriers.find(carrier => carrier.id === state.carrierId);
      const destination = carriers.find(carrier => carrier.id === action.carrierId);
      if (!destination) return { ok: false, reason: 'UNKNOWN_CARRIER' };
      if (carrierPosition(current, state.tick) !== carrierPosition(destination, state.tick)) {
        return { ok: false, reason: 'NOT_COLOCATED' };
      }
      carrierId = destination.id;
      transferCount++;
    } else if (action.type !== 'WAIT') {
      return { ok: false, reason: 'UNKNOWN_ACTION' };
    }

    const tick = state.tick + 1;
    const carrier = carriers.find(item => item.id === carrierId);
    return {
      ok: true,
      state: { tick, carrierId, transferCount },
      events: [{ type: action.type, tick, carrierId, station: carrierPosition(carrier, tick) }]
    };
  },

  isGoal(state, definition) {
    const { carriers, targetStation } = definition.runtime.parameters;
    const carrier = carriers.find(item => item.id === state.carrierId);
    return state.tick > 0 && carrierPosition(carrier, state.tick) === targetStation;
  },

  isFailure(state, definition) {
    return state.tick >= definition.runtime.parameters.turnLimit && !this.isGoal(state, definition);
  },

  hashState(state, definition) {
    const period = schedulePeriod(definition.runtime.parameters.carriers);
    return `${state.tick}|${state.tick % period}|${state.carrierId}|${state.transferCount}`;
  },

  explain(actions) {
    return actions.map((action, index) => action.type === 'WAIT'
      ? { step: index + 1, text: '继续乘坐当前载具，等待下一个会合时机。' }
      : { step: index + 1, text: `换乘到${action.carrierId}。` });
  },

  solve(definition) {
    return breadthFirstSolve(new PuzzleRuntime(definition, this), {
      maxDepth: definition.runtime.parameters.turnLimit,
      maxSolutions: 2
    });
  }
};

