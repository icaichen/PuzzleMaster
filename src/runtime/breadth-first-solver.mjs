export function breadthFirstSolve(runtime, { maxDepth = 20, maxSolutions = 2 } = {}) {
  const initialState = runtime.createInitialState();
  const queue = [{ state: initialState, path: [] }];
  const minimumDepth = new Map([[runtime.hashState(initialState), 0]]);
  const solutions = [];
  let shortest = null;
  let expanded = 0;

  while (queue.length > 0) {
    const current = queue.shift();
    const depth = current.path.length;
    if (shortest !== null && depth >= shortest) continue;
    if (depth >= maxDepth) continue;
    expanded++;

    for (const action of runtime.enumerateActions(current.state)) {
      const result = runtime.applyAction(current.state, action);
      if (!result.ok) continue;
      const nextDepth = depth + 1;
      const nextPath = [...current.path, action];
      const status = runtime.status(result.state);

      if (status.goal) {
        if (shortest === null) shortest = nextDepth;
        if (nextDepth === shortest && solutions.length < maxSolutions) solutions.push(nextPath);
        continue;
      }
      if (status.failure) continue;

      const hash = runtime.hashState(result.state);
      const previousDepth = minimumDepth.get(hash);
      if (previousDepth !== undefined && previousDepth < nextDepth) continue;
      minimumDepth.set(hash, nextDepth);
      queue.push({ state: result.state, path: nextPath });
    }
  }

  return {
    shortest,
    solutions,
    solutionCountCapped: solutions.length,
    statesVisited: minimumDepth.size,
    statesExpanded: expanded
  };
}

