import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PuzzleRuntime } from '../src/runtime/contract.mjs';
import { MechanismRegistry } from '../src/runtime/registry.mjs';
import { ConstraintResult, createVariableMap, evaluateConstraint, solveCsp } from '../src/kernels/csp-assignment.mjs';
import { artifactLineupMechanism } from '../src/mechanisms/artifact-lineup.mjs';

const root = new URL('../', import.meta.url);
const definition = JSON.parse(await readFile(new URL('examples/distorted-exhibit-record.puzzle.json', root), 'utf8'));
const registryData = JSON.parse(await readFile(new URL('data/mechanisms/registry.json', root), 'utf8'));
const record = registryData.mechanisms.find(mechanism => mechanism.id === artifactLineupMechanism.id);

const registry = new MechanismRegistry();
registry.register(record, artifactLineupMechanism);
const runtime = new PuzzleRuntime(definition, artifactLineupMechanism);

const variables = definition.runtime.parameters.variables;
const constraints = definition.runtime.parameters.constraints;
const report = artifactLineupMechanism.solve(definition, { maxSolutions: 20 });
const expected = { FEATHER: 4, KEY: 2, ORRERY: 1, LANTERN: 5, MASK: 3 };
assert.deepEqual(report.solutions, [expected]);
assert.equal(report.nodesVisited, 50);

const variableMap = createVariableMap(variables);
const truthConstraint = constraints.at(-1);
assert.equal(evaluateConstraint(truthConstraint, {}, variableMap), ConstraintResult.UNKNOWN);
assert.equal(evaluateConstraint(truthConstraint, expected, variableMap), ConstraintResult.TRUE);

const clueSolutionCounts = [];
for (let index = 1; index < constraints.length; index++) {
  const reduced = constraints.filter((_, constraintIndex) => constraintIndex !== index);
  const reducedReport = solveCsp({ variables, constraints: reduced }, { maxSolutions: 20 });
  clueSolutionCounts.push(reducedReport.solutions.length);
  assert.ok(reducedReport.solutions.length > 1, `Constraint ${index} must be necessary for uniqueness`);
}
assert.deepEqual(clueSolutionCounts, [10, 3, 4, 6]);

const initial = runtime.createInitialState();
const placed = runtime.applyAction(initial, { type: 'PLACE', variable: 'ORRERY', value: 1 });
assert.equal(placed.ok, true);
assert.deepEqual(initial, { assignments: {} }, 'Placement must not mutate caller state');
const displaced = runtime.applyAction(placed.state, { type: 'PLACE', variable: 'KEY', value: 1 });
assert.deepEqual(displaced.state, { assignments: { KEY: 1 } }, 'Placing into an occupied slot displaces the previous object');
assert.deepEqual(runtime.applyAction(initial, { type: 'PLACE', variable: 'UNKNOWN', value: 1 }), { ok: false, reason: 'UNKNOWN_VARIABLE' });

const solutionActions = Object.entries(expected).map(([variable, value]) => ({ type: 'PLACE', variable, value }));
const replay = runtime.replay(solutionActions);
assert.equal(replay.ok, true);
assert.deepEqual(replay.status, { goal: true, failure: false });
assert.equal(artifactLineupMechanism.explain(expected).length, 5);

console.log(JSON.stringify({
  protocol: 'passed',
  mechanism: artifactLineupMechanism.id,
  runtimeKernel: artifactLineupMechanism.runtimeKernel,
  solutions: report.solutions.length,
  solverNodesVisited: report.nodesVisited,
  clueNecessitySolutionCounts: clueSolutionCounts
}, null, 2));

