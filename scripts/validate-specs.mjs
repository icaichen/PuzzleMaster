import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const rootUrl = new URL('../', import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, rootUrl), 'utf8'));

const schema = await readJson('schemas/puzzle-definition.schema.json');
const mechanismRegistry = await readJson('data/mechanisms/registry.json');
const mechanisms = new Map(mechanismRegistry.mechanisms.map(mechanism => [mechanism.id, mechanism]));
const exampleFiles = (await readdir(new URL('examples/', rootUrl))).filter(file => file.endsWith('.puzzle.json')).sort();
const puzzles = await Promise.all(exampleFiles.map(file => readJson(`examples/${file}`)));

function typeMatches(value, expected) {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'integer') return Number.isInteger(value);
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === expected;
}

function validate(node, definition, path = '$') {
  const errors = [];
  if (definition.const !== undefined && node !== definition.const) errors.push(`${path}: must equal ${definition.const}`);
  if (definition.enum && !definition.enum.includes(node)) errors.push(`${path}: value is outside enum`);

  if (definition.type) {
    const expected = Array.isArray(definition.type) ? definition.type : [definition.type];
    if (!expected.some(type => typeMatches(node, type))) {
      errors.push(`${path}: expected ${expected.join('|')}`);
      return errors;
    }
  }

  if (typeof node === 'string') {
    if (definition.minLength !== undefined && node.length < definition.minLength) errors.push(`${path}: string is too short`);
    if (definition.maxLength !== undefined && node.length > definition.maxLength) errors.push(`${path}: string is too long`);
    if (definition.pattern && !new RegExp(definition.pattern).test(node)) errors.push(`${path}: pattern mismatch`);
    if (definition.format === 'date-time' && Number.isNaN(Date.parse(node))) errors.push(`${path}: invalid date-time`);
  }

  if (typeof node === 'number') {
    if (definition.minimum !== undefined && node < definition.minimum) errors.push(`${path}: below minimum`);
    if (definition.maximum !== undefined && node > definition.maximum) errors.push(`${path}: above maximum`);
  }

  if (Array.isArray(node)) {
    if (definition.minItems !== undefined && node.length < definition.minItems) errors.push(`${path}: too few items`);
    if (definition.uniqueItems) {
      const keys = node.map(value => JSON.stringify(value));
      if (new Set(keys).size !== keys.length) errors.push(`${path}: duplicate items`);
    }
    if (definition.items) node.forEach((value, index) => errors.push(...validate(value, definition.items, `${path}[${index}]`)));
  }

  if (node !== null && typeof node === 'object' && !Array.isArray(node)) {
    for (const key of definition.required ?? []) {
      if (!(key in node)) errors.push(`${path}.${key}: required property missing`);
    }
    if (definition.additionalProperties === false) {
      for (const key of Object.keys(node)) {
        if (!(key in (definition.properties ?? {}))) errors.push(`${path}.${key}: unexpected property`);
      }
    }
    for (const [key, childDefinition] of Object.entries(definition.properties ?? {})) {
      if (key in node) errors.push(...validate(node[key], childDefinition, `${path}.${key}`));
    }
  }
  return errors;
}

const allErrors = [];
for (const puzzle of puzzles) {
  const schemaErrors = validate(puzzle, schema);
  allErrors.push(...schemaErrors.map(error => `${puzzle.identity?.id ?? 'unknown'}: ${error}`));

  assert.equal(puzzle.products.app || puzzle.products.wechat, true, 'At least one product must be enabled');
  const mechanism = mechanisms.get(puzzle.identity.mechanismId);
  assert.ok(mechanism, `Mechanism ${puzzle.identity.mechanismId} must exist in registry`);
  assert.equal(puzzle.identity.runtimeKernel, mechanism.runtimeKernel, 'Puzzle runtime kernel must match mechanism registry');
  assert.equal(puzzle.identity.mechanismVersion, mechanism.version, 'Puzzle mechanism version must match registry');
  assert.deepEqual(puzzle.content.hints.map(hint => hint.tier), [1, 2, 3], 'Required hint tiers must be ordered');

  if (puzzle.identity.status === 'MACHINE_VERIFIED') {
    assert.equal(puzzle.verification.status, 'PASSED', 'Machine-verified puzzle must have passed evidence');
  }
  if (puzzle.solutionPolicy.kind === 'UNIQUE') {
    assert.equal(puzzle.solutionPolicy.maxAcceptedSolutions, 1, 'Unique policy accepts exactly one solution');
    assert.equal(puzzle.verification.solutionCount, 1, 'Unique puzzle must verify exactly one solution');
  }
}
assert.deepEqual(allErrors, [], `Puzzle schema errors:\n${allErrors.join('\n')}`);

const mechanismIds = mechanismRegistry.mechanisms.map(mechanism => mechanism.id);
assert.equal(new Set(mechanismIds).size, mechanismIds.length, 'Mechanism registry IDs must be unique');

console.log(JSON.stringify({
  schemaVersion: schema.properties.schemaVersion.const,
  validatedPuzzles: puzzles.map(puzzle => puzzle.identity.id),
  registeredOriginalMechanisms: mechanismIds.length,
  schemaErrors: allErrors.length
}, null, 2));
