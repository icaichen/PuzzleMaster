export const ConstraintResult = Object.freeze({
  TRUE: 'TRUE',
  FALSE: 'FALSE',
  UNKNOWN: 'UNKNOWN'
});

function assigned(assignment, variable) {
  return Object.prototype.hasOwnProperty.call(assignment, variable);
}

function binaryValues(constraint, assignment) {
  if (!assigned(assignment, constraint.left) || !assigned(assignment, constraint.right)) return null;
  return [assignment[constraint.left], assignment[constraint.right]];
}

export function evaluateConstraint(constraint, assignment, variables) {
  const { TRUE, FALSE, UNKNOWN } = ConstraintResult;
  switch (constraint.type) {
    case 'ALL_DIFFERENT': {
      const values = constraint.variables.filter(variable => assigned(assignment, variable)).map(variable => assignment[variable]);
      if (new Set(values).size !== values.length) return FALSE;
      return values.length === constraint.variables.length ? TRUE : UNKNOWN;
    }
    case 'OFFSET': {
      const values = binaryValues(constraint, assignment);
      return values ? (values[0] === values[1] + constraint.delta ? TRUE : FALSE) : UNKNOWN;
    }
    case 'LESS_THAN': {
      const values = binaryValues(constraint, assignment);
      return values ? (values[0] < values[1] ? TRUE : FALSE) : UNKNOWN;
    }
    case 'ADJACENT': {
      const values = binaryValues(constraint, assignment);
      return values ? (Math.abs(values[0] - values[1]) === 1 ? TRUE : FALSE) : UNKNOWN;
    }
    case 'NOT_ADJACENT': {
      const values = binaryValues(constraint, assignment);
      return values ? (Math.abs(values[0] - values[1]) !== 1 ? TRUE : FALSE) : UNKNOWN;
    }
    case 'AT_END': {
      if (!assigned(assignment, constraint.variable)) return UNKNOWN;
      const variable = variables.get(constraint.variable);
      const minimum = Math.min(...variable.domain);
      const maximum = Math.max(...variable.domain);
      return assignment[constraint.variable] === minimum || assignment[constraint.variable] === maximum ? TRUE : FALSE;
    }
    case 'IN_SET': {
      if (!assigned(assignment, constraint.variable)) return UNKNOWN;
      return constraint.values.includes(assignment[constraint.variable]) ? TRUE : FALSE;
    }
    case 'EXACTLY': {
      const results = constraint.constraints.map(child => evaluateConstraint(child, assignment, variables));
      const trueCount = results.filter(result => result === TRUE).length;
      const unknownCount = results.filter(result => result === UNKNOWN).length;
      if (trueCount > constraint.count || trueCount + unknownCount < constraint.count) return FALSE;
      return unknownCount === 0 && trueCount === constraint.count ? TRUE : UNKNOWN;
    }
    default:
      throw new Error(`Unsupported CSP constraint: ${constraint.type}`);
  }
}

export function createVariableMap(variableDefinitions) {
  const variables = new Map(variableDefinitions.map(variable => [variable.id, variable]));
  if (variables.size !== variableDefinitions.length) throw new Error('CSP variable IDs must be unique');
  return variables;
}

export function evaluateConstraints(constraints, assignment, variables) {
  const results = constraints.map(constraint => evaluateConstraint(constraint, assignment, variables));
  return {
    results,
    consistent: !results.includes(ConstraintResult.FALSE),
    complete: results.every(result => result === ConstraintResult.TRUE)
  };
}

export function solveCsp({ variables: variableDefinitions, constraints }, { maxSolutions = 2 } = {}) {
  const variables = createVariableMap(variableDefinitions);
  const solutions = [];
  let nodesVisited = 0;
  let rejectedBranches = 0;

  function search(assignment) {
    if (solutions.length >= maxSolutions) return;
    nodesVisited++;
    const evaluation = evaluateConstraints(constraints, assignment, variables);
    if (!evaluation.consistent) {
      rejectedBranches++;
      return;
    }
    if (Object.keys(assignment).length === variableDefinitions.length) {
      if (evaluation.complete) solutions.push({ ...assignment });
      return;
    }

    const unassigned = variableDefinitions
      .filter(variable => !assigned(assignment, variable.id))
      .map(variable => ({
        variable,
        legalValues: variable.domain.filter(value => {
          const next = { ...assignment, [variable.id]: value };
          return evaluateConstraints(constraints, next, variables).consistent;
        })
      }))
      .sort((a, b) => a.legalValues.length - b.legalValues.length || a.variable.id.localeCompare(b.variable.id));

    const choice = unassigned[0];
    for (const value of choice.legalValues) search({ ...assignment, [choice.variable.id]: value });
  }

  search({});
  return { solutions, solutionCountCapped: solutions.length, nodesVisited, rejectedBranches };
}

