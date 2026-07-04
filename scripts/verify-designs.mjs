import assert from 'node:assert/strict';
import { generateTemperatureBatch, solveTemperatureRoute } from './lib/temperature-swap-route.mjs';

function verifyEchoCourier() {
  const directions = {
    U: [0, -1],
    D: [0, 1],
    L: [-1, 0],
    R: [1, 0]
  };
  const actions = Object.keys(directions);
  const walls = new Set(['3,3', '4,3']);
  const key = ([x, y]) => `${x},${y}`;
  const move = (position, action) => {
    const [dx, dy] = directions[action];
    const next = [position[0] + dx, position[1] + dy];
    if (next[0] < 1 || next[0] > 4 || next[1] < 1 || next[1] > 4 || walls.has(key(next))) {
      return null;
    }
    return next;
  };

  const solutions = [];
  const search = (turn, courier, echo, history) => {
    if (turn === 7) {
      if (key(courier) === '2,3' && key(echo) === '2,4') solutions.push([...history]);
      return;
    }
    for (const action of actions) {
      const nextCourier = move(courier, action);
      if (!nextCourier) continue;
      const echoAction = turn >= 2 ? history[turn - 2] : null;
      const nextEcho = echoAction ? move(echo, echoAction) : echo;
      if (!nextEcho || key(nextCourier) === key(nextEcho)) continue;
      search(turn + 1, nextCourier, nextEcho, [...history, action]);
    }
  };

  search(0, [3, 1], [2, 1], []);
  assert.deepEqual(solutions, [['D', 'L', 'D', 'D', 'R', 'L', 'U']]);
  return { candidates: 4 ** 7, solutions: solutions.length, solution: solutions[0].join('') };
}

function verifyLayeredGlass() {
  const strips = {
    A: 'A...C.A',
    B: '.A....B',
    C: 'B.DA.A.',
    D: '.AD.A.B',
    E: '...D..A'
  };
  const target = 'BADDCAB';

  const permutations = values => {
    if (values.length <= 1) return [values];
    return values.flatMap((value, index) =>
      permutations([...values.slice(0, index), ...values.slice(index + 1)]).map(rest => [value, ...rest])
    );
  };
  const render = order => {
    const visible = Array(7).fill('.');
    for (const id of order) {
      [...strips[id]].forEach((colour, index) => {
        if (colour !== '.') visible[index] = colour;
      });
    }
    return visible.join('');
  };

  const candidates = permutations(Object.keys(strips));
  const solutions = candidates.filter(order => render(order) === target);
  assert.deepEqual(solutions, [['D', 'A', 'C', 'E', 'B']]);
  return { candidates: candidates.length, solutions: solutions.length, solution: solutions[0].join('') };
}

function verifyTidalLighthouse() {
  const ringChoices = [0, 1, 2]; // inner, middle, outer
  const targetTrace = [null, null, 0, null, 0, null, 0];
  const modulo = value => ((value % 4) + 4) % 4;

  const step = (positions, ring) => {
    const adjusted = [...positions];
    adjusted[ring] = modulo(adjusted[ring] + 1);
    const beam = adjusted[0] === adjusted[1] && adjusted[1] === adjusted[2] ? adjusted[0] : null;
    return {
      positions: [adjusted[0], modulo(adjusted[1] + 1), modulo(adjusted[2] + 2)],
      beam
    };
  };

  const solutions = [];
  const search = (turn, positions, choices, trace) => {
    if (turn === 7) {
      if (trace.every((beam, index) => beam === targetTrace[index])) solutions.push([...choices]);
      return;
    }
    for (const ring of ringChoices) {
      const next = step(positions, ring);
      if (next.beam !== targetTrace[turn]) continue;
      search(turn + 1, next.positions, [...choices, ring], [...trace, next.beam]);
    }
  };

  search(0, [0, 2, 1], [], []);
  assert.deepEqual(solutions, [[2, 2, 2, 1, 1, 1, 1]]);
  return { candidates: 3 ** 7, solutions: solutions.length, solution: solutions[0].join('') };
}

function verifyTemperatureCourier() {
  const report = solveTemperatureRoute({
    nodeCount: 7,
    edges: [[0, 1], [1, 2], [0, 3], [0, 4], [3, 5], [5, 6], [1, 5], [2, 3]],
    values: [2, 3, 3, 4, 1, 3, 3],
    start: 0,
    goal: 6,
    pickups: [2, 4],
    requiredDifference: 1,
    turnLimit: 10
  }, 10);
  assert.equal(report.shortest, 7);
  assert.deepEqual(report.solutions, [[0, 4, 0, 1, 2, 1, 5, 6]]);
  return {
    statesVisited: report.statesVisited,
    shortest: report.shortest,
    solutions: report.solutions.length,
    solution: report.solutions[0].map(node => 'ABCDEFG'[node]).join('')
  };
}

function verifyTemperatureGeneration() {
  const first = generateTemperatureBatch('nav-03-determinism', 2);
  const second = generateTemperatureBatch('nav-03-determinism', 2);
  assert.deepEqual(first, second);
  assert.equal(new Set(first.map(candidate => candidate.fingerprint)).size, first.length);
  assert.ok(first.every(candidate => candidate.verification.solutionCount === 1));
  assert.ok(first.every(candidate => candidate.verification.dynamicallyUnlockedEdges >= 1));
  return {
    deterministic: true,
    generated: first.length,
    uniqueFingerprints: new Set(first.map(candidate => candidate.fingerprint)).size
  };
}

const results = {
  echoCourier: verifyEchoCourier(),
  layeredGlass: verifyLayeredGlass(),
  tidalLighthouse: verifyTidalLighthouse(),
  temperatureCourier: verifyTemperatureCourier(),
  temperatureGeneration: verifyTemperatureGeneration()
};

console.log(JSON.stringify(results, null, 2));
