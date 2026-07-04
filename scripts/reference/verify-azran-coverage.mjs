import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { azranMechanismPatterns } from './azran-mechanism-map.mjs';
import { azranPatternContracts } from './azran-pattern-contracts.mjs';

const root = new URL('../../', import.meta.url);
const coverage = JSON.parse(await readFile(new URL('data/reference/azran-coverage.json', root), 'utf8'));

assert.equal(coverage.puzzleCount, 165);
assert.equal(coverage.puzzles.length, 165);
assert.equal(coverage.mechanismPatternCount, azranMechanismPatterns.length);
assert.equal(coverage.mechanismPatternCount, 96);
assert.equal(Object.keys(azranPatternContracts).length, 96);
assert.deepEqual(Object.keys(azranPatternContracts).sort(), azranMechanismPatterns.map(pattern => pattern[0]).sort());
assert.ok(Object.values(azranPatternContracts).every(contract => contract.length === 5 && contract.every(value => value.length > 0)));
assert.equal(coverage.runtimeKernelCount, 30);
assert.equal(coverage.coverage, 1);

const numbers = coverage.puzzles.map(puzzle => puzzle.number);
assert.deepEqual(numbers, Array.from({ length: 165 }, (_, index) => String(index + 1).padStart(3, '0')));
assert.equal(new Set(numbers).size, 165);
assert.ok(coverage.puzzles.every(puzzle => puzzle.id && puzzle.kernel && puzzle.generationFit && puzzle.sourceUrl));

const assigned = azranMechanismPatterns.flatMap(pattern => pattern[4]);
assert.equal(assigned.length, 165);
assert.equal(new Set(assigned).size, 165);

console.log(JSON.stringify({
  referencePuzzles: 165,
  mechanismPatterns: 96,
  structuralContracts: 96,
  runtimeKernels: 30,
  coverage: '100%',
  duplicates: 0,
  missing: 0
}, null, 2));
