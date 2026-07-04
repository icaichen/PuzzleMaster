import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PuzzleRuntime } from '../src/runtime/contract.mjs';
import { MechanismRegistry } from '../src/runtime/registry.mjs';
import {
  classifyPointInPolygon,
  isSimplePolygon,
  polygonArea2,
  segmentsIntersect,
  solveLineRegion
} from '../src/kernels/line-region-geometry.mjs';
import { pairedBeaconBoundaryMechanism } from '../src/mechanisms/paired-beacon-boundary.mjs';

const root = new URL('../', import.meta.url);
const definition = JSON.parse(await readFile(new URL('examples/twin-signal-boundary.puzzle.json', root), 'utf8'));
const registryData = JSON.parse(await readFile(new URL('data/mechanisms/registry.json', root), 'utf8'));
const record = registryData.mechanisms.find(mechanism => mechanism.id === pairedBeaconBoundaryMechanism.id);
const parameters = definition.runtime.parameters;

const registry = new MechanismRegistry();
registry.register(record, pairedBeaconBoundaryMechanism);
const runtime = new PuzzleRuntime(definition, pairedBeaconBoundaryMechanism);

assert.equal(segmentsIntersect({ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }), true);
assert.equal(segmentsIntersect({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }), false);
assert.equal(isSimplePolygon([{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 }]), false);
const square = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }];
assert.equal(polygonArea2(square), 8);
assert.equal(classifyPointInPolygon({ x: 1, y: 1 }, square), 'INSIDE');
assert.equal(classifyPointInPolygon({ x: 3, y: 1 }, square), 'OUTSIDE');
assert.equal(classifyPointInPolygon({ x: 2, y: 1 }, square), 'BOUNDARY');

const report = pairedBeaconBoundaryMechanism.solve(definition);
const expected = ['A', 'C', 'D', 'E', 'B', 'F', 'G'];
assert.deepEqual(report.solutions, [expected]);
assert.equal(report.candidatesVisited, 360);

const beaconOnly = solveLineRegion({ ...parameters, targetArea2: null });
assert.equal(beaconOnly.solutions.length, 2, 'Beacon rule alone must not establish uniqueness');
const areaOnly = solveLineRegion({ ...parameters, beaconPairs: [] });
assert.equal(areaOnly.solutions.length, 2, 'Area rule alone must not establish uniqueness');

let state = runtime.createInitialState();
for (const anchorId of expected) {
  const result = runtime.applyAction(state, { type: 'ADD_ANCHOR', anchorId });
  assert.equal(result.ok, true);
  state = result.state;
}
const closed = runtime.applyAction(state, { type: 'CLOSE' });
assert.equal(closed.ok, true);
assert.deepEqual(runtime.status(closed.state), { goal: true, failure: false });
assert.deepEqual(runtime.createInitialState(), { order: [], closed: false });
assert.equal(runtime.applyAction(runtime.createInitialState(), { type: 'ADD_ANCHOR', anchorId: 'UNKNOWN' }).reason, 'UNKNOWN_ANCHOR');

const replay = runtime.replay([...expected.map(anchorId => ({ type: 'ADD_ANCHOR', anchorId })), { type: 'CLOSE' }]);
assert.equal(replay.ok, true);
assert.equal(replay.status.goal, true);

console.log(JSON.stringify({
  protocol: 'passed',
  mechanism: pairedBeaconBoundaryMechanism.id,
  runtimeKernel: pairedBeaconBoundaryMechanism.runtimeKernel,
  canonicalCandidates: report.candidatesVisited,
  areaOnlySolutions: areaOnly.solutions.length,
  beaconOnlySolutions: beaconOnly.solutions.length,
  combinedSolutions: report.solutions.length
}, null, 2));
