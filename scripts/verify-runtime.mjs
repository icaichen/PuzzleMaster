import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PuzzleRuntime } from '../src/runtime/contract.mjs';
import { MechanismRegistry } from '../src/runtime/registry.mjs';
import { schedulePeriod } from '../src/kernels/time-expanded-route.mjs';
import { movingCarrierTransferMechanism } from '../src/mechanisms/moving-carrier-transfer.mjs';

const root = new URL('../', import.meta.url);
const definition = JSON.parse(await readFile(new URL('examples/clockwork-transfer.puzzle.json', root), 'utf8'));
const registryData = JSON.parse(await readFile(new URL('data/mechanisms/registry.json', root), 'utf8'));
const record = registryData.mechanisms.find(mechanism => mechanism.id === movingCarrierTransferMechanism.id);

const registry = new MechanismRegistry();
registry.register(record, movingCarrierTransferMechanism);
assert.equal(registry.list().length, 1);
assert.equal(registry.get('ORG-NAV-003').implementation, movingCarrierTransferMechanism);

const runtime = new PuzzleRuntime(definition, movingCarrierTransferMechanism);
const initial = runtime.createInitialState();
assert.deepEqual(initial, definition.runtime.initialState);
assert.equal(schedulePeriod(definition.runtime.parameters.carriers), 4);
assert.deepEqual(runtime.enumerateActions(initial), [{ type: 'WAIT' }]);

const invalidTransfer = runtime.applyAction(initial, { type: 'TRANSFER', carrierId: 'GREEN' });
assert.deepEqual(invalidTransfer, { ok: false, reason: 'NOT_COLOCATED' });
assert.deepEqual(initial, definition.runtime.initialState, 'Runtime must not mutate caller state');

const solution = [
  { type: 'WAIT' },
  { type: 'WAIT' },
  { type: 'TRANSFER', carrierId: 'GREEN' },
  { type: 'WAIT' },
  { type: 'TRANSFER', carrierId: 'EXPRESS' }
];
const replay = runtime.replay(solution);
assert.equal(replay.ok, true);
assert.deepEqual(replay.status, { goal: true, failure: false });
assert.deepEqual(replay.state, { tick: 5, carrierId: 'EXPRESS', transferCount: 2 });
assert.deepEqual(JSON.parse(JSON.stringify(replay.state)), replay.state, 'State must be JSON serializable');

const report = movingCarrierTransferMechanism.solve(definition);
assert.equal(report.shortest, 5);
assert.equal(report.solutions.length, 1);
assert.deepEqual(report.solutions[0], solution);
assert.equal(report.statesVisited, 9);
assert.equal(movingCarrierTransferMechanism.explain(solution).length, 5);

assert.throws(() => new PuzzleRuntime({
  ...definition,
  identity: { ...definition.identity, runtimeKernel: 'GRID_ROUTE' }
}, movingCarrierTransferMechanism), /runtimeKernel/);

console.log(JSON.stringify({
  protocol: 'passed',
  registry: 'passed',
  mechanism: movingCarrierTransferMechanism.id,
  runtimeKernel: movingCarrierTransferMechanism.runtimeKernel,
  schedulePeriod: 4,
  shortest: report.shortest,
  solutions: report.solutions.length,
  statesVisited: report.statesVisited
}, null, 2));

