import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PuzzleRuntime } from '../src/runtime/contract.mjs';
import { MechanismRegistry } from '../src/runtime/registry.mjs';
import { enumerateUniqueTransforms, solvePieceAssembly, transformPiece } from '../src/kernels/piece-assembly.mjs';
import { singleLoopMosaicMechanism } from '../src/mechanisms/single-loop-mosaic.mjs';

const root = new URL('../', import.meta.url);
const definition = JSON.parse(await readFile(new URL('examples/riveted-circuit-mosaic.puzzle.json', root), 'utf8'));
const registryData = JSON.parse(await readFile(new URL('data/mechanisms/registry.json', root), 'utf8'));
const record = registryData.mechanisms.find(mechanism => mechanism.id === singleLoopMosaicMechanism.id);
const parameters = definition.runtime.parameters;

const registry = new MechanismRegistry();
registry.register(record, singleLoopMosaicMechanism);
const runtime = new PuzzleRuntime(definition, singleLoopMosaicMechanism);

const rotated = transformPiece({ id: 'TEST', cells: [{ x: 0, y: 0, ports: ['N'] }, { x: 1, y: 0, ports: ['E'] }] }, 1);
assert.deepEqual(rotated, [{ x: 0, y: 0, ports: ['E'] }, { x: 0, y: 1, ports: ['S'] }]);
assert.equal(enumerateUniqueTransforms({ id: 'DOT', cells: [{ x: 0, y: 0, ports: [] }] }).length, 1);

const report = singleLoopMosaicMechanism.solve(definition, { maxSolutions: 10 });
assert.equal(report.solutions.length, 1);
assert.deepEqual(report.solutions[0].map(placement => placement.key), [
  'P1:R0@0,0', 'P2:R0@2,0', 'P3:R0@0,1', 'P4:R0@1,2'
]);

const shapeOnly = solvePieceAssembly(parameters, { maxSolutions: 20, requireChannel: false });
assert.equal(shapeOnly.solutions.length, 6, 'The channel rule must remove multiple silhouette-only assemblies');
const withoutFixed = solvePieceAssembly({ ...parameters, fixedPlacements: [] }, { maxSolutions: 10 });
assert.equal(withoutFixed.solutions.length, 2, 'The riveted piece must remove whole-board rotational symmetry');

const initial = runtime.createInitialState();
assert.deepEqual(initial.placements.map(placement => placement.key), ['P1:R0@0,0']);
assert.equal(runtime.applyAction(initial, { type: 'REMOVE', pieceId: 'P1' }).reason, 'PIECE_FIXED');
assert.equal(runtime.applyAction(initial, { type: 'PLACE', pieceId: 'UNKNOWN', rotation: 0, offset: { x: 0, y: 0 } }).reason, 'INVALID_PLACEMENT');

const actions = report.solutions[0].slice(1).map(placement => ({
  type: 'PLACE', pieceId: placement.pieceId, rotation: placement.rotation, offset: placement.offset
}));
const replay = runtime.replay(actions);
assert.equal(replay.ok, true);
assert.deepEqual(replay.status, { goal: true, failure: false });
assert.equal(singleLoopMosaicMechanism.explain(replay.state, definition).singleLoop, true);

console.log(JSON.stringify({
  protocol: 'passed',
  mechanism: singleLoopMosaicMechanism.id,
  runtimeKernel: singleLoopMosaicMechanism.runtimeKernel,
  shapeOnlySolutions: shapeOnly.solutions.length,
  withoutFixedPieceSolutions: withoutFixed.solutions.length,
  combinedSolutions: report.solutions.length,
  solverNodesVisited: report.nodesVisited
}, null, 2));
