const NODE_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function hashSeed(seed) {
  let hash = 2166136261;
  for (const char of seed) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sample(random, values) {
  return values[Math.floor(random() * values.length)];
}

function shuffle(random, values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function buildAdjacency(nodeCount, edges) {
  const adjacency = Array.from({ length: nodeCount }, () => []);
  for (const [from, to] of edges) {
    adjacency[from].push(to);
    adjacency[to].push(from);
  }
  adjacency.forEach(neighbors => neighbors.sort((a, b) => a - b));
  return adjacency;
}

function stateKey(state) {
  return `${state.position}|${state.values.join(',')}|${state.collected}`;
}

export function solveTemperatureRoute(definition, maxDepth = definition.turnLimit) {
  const adjacency = buildAdjacency(definition.nodeCount, definition.edges);
  const pickupIndex = new Map(definition.pickups.map((node, index) => [node, index]));
  const fullMask = (1 << definition.pickups.length) - 1;
  const initialMask = pickupIndex.has(definition.start) ? 1 << pickupIndex.get(definition.start) : 0;
  const initial = {
    position: definition.start,
    values: [...definition.values],
    collected: initialMask,
    path: [definition.start]
  };
  const queue = [initial];
  const minimumDepth = new Map([[stateKey(initial), 0]]);
  const solutions = [];
  let shortest = null;
  let expanded = 0;

  while (queue.length > 0) {
    const state = queue.shift();
    const depth = state.path.length - 1;
    if (shortest !== null && depth >= shortest) continue;
    if (depth >= maxDepth) continue;
    expanded++;

    for (const destination of adjacency[state.position]) {
      if (Math.abs(state.values[state.position] - state.values[destination]) !== definition.requiredDifference) continue;
      const values = [...state.values];
      [values[state.position], values[destination]] = [values[destination], values[state.position]];
      const pickup = pickupIndex.get(destination);
      const collected = pickup === undefined ? state.collected : state.collected | (1 << pickup);
      const path = [...state.path, destination];
      const nextDepth = depth + 1;

      if (destination === definition.goal && collected === fullMask) {
        if (shortest === null) shortest = nextDepth;
        if (nextDepth === shortest) solutions.push(path);
        continue;
      }

      const next = { position: destination, values, collected, path };
      const key = stateKey(next);
      const previousDepth = minimumDepth.get(key);
      if (previousDepth !== undefined && previousDepth < nextDepth) continue;
      minimumDepth.set(key, nextDepth);
      queue.push(next);
    }
  }

  return {
    shortest,
    solutions,
    statesVisited: minimumDepth.size,
    statesExpanded: expanded
  };
}

export function analyzeTemperatureSolution(definition, path) {
  const adjacency = buildAdjacency(definition.nodeCount, definition.edges);
  const initialLegalEdges = new Set(definition.edges
    .filter(([a, b]) => Math.abs(definition.values[a] - definition.values[b]) === definition.requiredDifference)
    .map(([a, b]) => edgeKey(a, b)));
  const values = [...definition.values];
  const dynamicallyUnlocked = new Set();
  let decisionPoints = 0;

  for (let index = 0; index < path.length - 1; index++) {
    const from = path[index];
    const to = path[index + 1];
    const legalMoves = adjacency[from].filter(node => Math.abs(values[from] - values[node]) === definition.requiredDifference);
    if (legalMoves.length > 1) decisionPoints++;
    if (!initialLegalEdges.has(edgeKey(from, to))) dynamicallyUnlocked.add(edgeKey(from, to));
    [values[from], values[to]] = [values[to], values[from]];
  }

  return {
    dynamicallyUnlockedEdges: dynamicallyUnlocked.size,
    decisionPoints,
    revisits: path.length - new Set(path).size,
    distinctNodesVisited: new Set(path).size
  };
}

function permutations(values) {
  if (values.length <= 1) return [values];
  return values.flatMap((value, index) =>
    permutations([...values.slice(0, index), ...values.slice(index + 1)]).map(rest => [value, ...rest])
  );
}

export function canonicalTemperatureFingerprint(definition) {
  const pickupSet = new Set(definition.pickups);
  const neutral = Array.from({ length: definition.nodeCount }, (_, index) => index)
    .filter(node => node !== definition.start && node !== definition.goal && !pickupSet.has(node));
  const orders = [];
  for (const pickupOrder of permutations(definition.pickups)) {
    for (const neutralOrder of permutations(neutral)) {
      orders.push([definition.start, ...pickupOrder, ...neutralOrder, definition.goal]);
    }
  }

  const edgeSet = new Set(definition.edges.map(([a, b]) => edgeKey(a, b)));
  const encodings = orders.map(order => {
    const values = order.map(node => definition.values[node]).join('');
    let graph = '';
    for (let left = 0; left < order.length; left++) {
      for (let right = left + 1; right < order.length; right++) {
        graph += edgeSet.has(edgeKey(order[left], order[right])) ? '1' : '0';
      }
    }
    return `${values}|${graph}`;
  });
  encodings.sort();
  return encodings[0];
}

export function generateTemperatureRoute(seed, options = {}) {
  const random = createRandom(seed);
  const nodeCount = options.nodeCount ?? 7;
  const minLength = options.minLength ?? 7;
  const maxLength = options.maxLength ?? 9;
  const maxAttempts = options.maxAttempts ?? 100000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const edges = [];
    const edgeSet = new Set();
    for (let node = 1; node < nodeCount; node++) {
      const parent = Math.floor(random() * node);
      edges.push([node, parent]);
      edgeSet.add(edgeKey(node, parent));
    }
    const desiredEdges = 8 + Math.floor(random() * 3);
    while (edges.length < desiredEdges) {
      const from = Math.floor(random() * nodeCount);
      const to = Math.floor(random() * nodeCount);
      if (from === to || edgeSet.has(edgeKey(from, to))) continue;
      edges.push([from, to]);
      edgeSet.add(edgeKey(from, to));
    }
    edges.forEach(edge => edge.sort((a, b) => a - b));
    edges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    const values = Array.from({ length: nodeCount }, () => 1 + Math.floor(random() * 4));
    if (new Set(values).size < 3) continue;
    const pickupCandidates = shuffle(random, Array.from({ length: nodeCount - 2 }, (_, index) => index + 1));
    const pickups = pickupCandidates.slice(0, 2).sort((a, b) => a - b);
    const definition = {
      nodeCount,
      edges,
      values,
      start: 0,
      goal: nodeCount - 1,
      pickups,
      requiredDifference: 1,
      turnLimit: maxLength
    };
    const adjacency = buildAdjacency(nodeCount, edges);
    if (pickups.some(node => adjacency[node].length < 2)) continue;

    const report = solveTemperatureRoute(definition, maxLength);
    if (report.shortest === null || report.shortest < minLength || report.shortest > maxLength) continue;
    if (report.solutions.length !== 1) continue;
    const analysis = analyzeTemperatureSolution(definition, report.solutions[0]);
    const solution = report.solutions[0];
    if (solution.slice(1, -1).includes(definition.goal)) continue;
    if (analysis.revisits < 1 || analysis.dynamicallyUnlockedEdges < 1 || analysis.decisionPoints < 2) continue;
    if (analysis.distinctNodesVisited < nodeCount - 1) continue;
    if (report.statesVisited < 15 || report.statesVisited > 500) continue;

    return {
      seed,
      attempt,
      definition: {
        ...definition,
        turnLimit: report.shortest,
        nodes: NODE_NAMES.slice(0, nodeCount)
      },
      verification: {
        shortest: report.shortest,
        solutionCount: report.solutions.length,
        solution,
        statesVisited: report.statesVisited,
        statesExpanded: report.statesExpanded,
        ...analysis
      },
      fingerprint: canonicalTemperatureFingerprint(definition)
    };
  }
  throw new Error(`No accepted candidate found for seed ${seed} after ${maxAttempts} attempts`);
}

export function generateTemperatureBatch(seedPrefix, count, options = {}) {
  const results = [];
  const fingerprints = new Set();
  let index = 1;
  while (results.length < count) {
    const candidate = generateTemperatureRoute(`${seedPrefix}-${index}`, options);
    index++;
    if (fingerprints.has(candidate.fingerprint)) continue;
    fingerprints.add(candidate.fingerprint);
    results.push(candidate);
  }
  return results;
}
