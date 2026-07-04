import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { azranMechanismPatterns } from '../reference/azran-mechanism-map.mjs';
import { interactionAdapterMap } from './interaction-adapter-map.mjs';

const expected = new Map(azranMechanismPatterns.map(([id,,kernel]) => [id, kernel]));
assert.equal(interactionAdapterMap.length, 96, 'Every reference mechanism needs one adapter mapping');
const ids = interactionAdapterMap.map(([id]) => id);
assert.equal(new Set(ids).size, 96, 'Adapter mappings must not duplicate mechanisms');
assert.deepEqual([...ids].sort(), [...expected.keys()].sort(), 'Adapter mappings must cover REF-001 through REF-096 exactly');
for (const [id, adapterId, surface, input, visual] of interactionAdapterMap) {
  assert.match(adapterId, /^ADP-[A-Z0-9-]+$/);
  assert.ok(surface && input);
  assert.ok(['LOW','MEDIUM','HIGH'].includes(visual));
  assert.ok(expected.has(id));
}
const built = JSON.parse(await readFile(new URL('../../data/adapters/interaction-adapters.json', import.meta.url), 'utf8'));
assert.equal(built.sourceMechanisms, 96);
assert.equal(built.mappings.length, 96);
assert.equal(new Set(built.mappings.map(mapping => mapping.mechanismId)).size, 96);
for (const mapping of built.mappings) assert.equal(mapping.runtimeKernel, expected.get(mapping.mechanismId));
console.log(JSON.stringify({ coverage: '96/96', adapters: built.adapterCount, baseSurfaces: built.baseSurfaceCount, duplicates: 0, missing: 0 }, null, 2));
