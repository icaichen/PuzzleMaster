import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PuzzleRuntime } from '../src/runtime/contract.mjs';
import { MechanismRegistry } from '../src/runtime/registry.mjs';
import { generateThermalDominoCandidates, solveThermalDominoes } from '../src/kernels/grid-placement.mjs';
import { thermalDominoArrayMechanism } from '../src/mechanisms/thermal-domino-array.mjs';

const root = new URL('../', import.meta.url);
const definition = JSON.parse(await readFile(new URL('examples/thermal-domino-array.puzzle.json', root), 'utf8'));
const registryData = JSON.parse(await readFile(new URL('data/mechanisms/registry.json', root), 'utf8'));
const record = registryData.mechanisms.find(mechanism => mechanism.id === thermalDominoArrayMechanism.id);
const parameters = definition.runtime.parameters;
const registry = new MechanismRegistry();
registry.register(record, thermalDominoArrayMechanism);
const runtime = new PuzzleRuntime(definition, thermalDominoArrayMechanism);

assert.equal(generateThermalDominoCandidates(parameters).length, 34);
const report = thermalDominoArrayMechanism.solve(definition, { maxSolutions: 10 });
const expected = ['D03', 'D06', 'D09', 'D22', 'D29', 'D33'];
assert.deepEqual(report.solutions, [expected]);
const withoutAdjacency = solveThermalDominoes(parameters, { maxSolutions: 100, requireNonAdjacent: false });
const withoutVerticalCount = solveThermalDominoes(parameters, { maxSolutions: 100, requireVerticalTarget: false });
assert.equal(withoutAdjacency.solutions.length, 32);
assert.equal(withoutVerticalCount.solutions.length, 3);

const initial = runtime.createInitialState();
assert.deepEqual(initial, { selectedIds: ['D06'] });
assert.equal(runtime.applyAction(initial, { type: 'REMOVE', candidateId: 'D06' }).reason, 'CANDIDATE_FIXED');
assert.equal(runtime.applyAction(initial, { type: 'PLACE', candidateId: 'UNKNOWN' }).reason, 'UNKNOWN_CANDIDATE');
const replay = runtime.replay(expected.filter(id => id !== 'D06').map(candidateId => ({ type: 'PLACE', candidateId })));
assert.equal(replay.ok, true);
assert.deepEqual(replay.status, { goal: true, failure: false });
assert.equal(thermalDominoArrayMechanism.explain(replay.state, definition).verticalCount, 2);

console.log(JSON.stringify({
  protocol: 'passed', mechanism: thermalDominoArrayMechanism.id, runtimeKernel: thermalDominoArrayMechanism.runtimeKernel,
  candidates: 34, withoutHotAdjacencyRuleSolutions: withoutAdjacency.solutions.length,
  withoutVerticalCountSolutions: withoutVerticalCount.solutions.length, combinedSolutions: report.solutions.length,
  solverNodesVisited: report.nodesVisited
}, null, 2));
