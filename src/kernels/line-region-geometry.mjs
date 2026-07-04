const EPSILON = 1e-9;

export function cross(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

export function pointOnSegment(point, start, end) {
  return Math.abs(cross(start, end, point)) <= EPSILON
    && point.x >= Math.min(start.x, end.x) - EPSILON
    && point.x <= Math.max(start.x, end.x) + EPSILON
    && point.y >= Math.min(start.y, end.y) - EPSILON
    && point.y <= Math.max(start.y, end.y) + EPSILON;
}

function sign(value) {
  if (Math.abs(value) <= EPSILON) return 0;
  return value < 0 ? -1 : 1;
}

export function segmentsIntersect(a, b, c, d) {
  const abC = sign(cross(a, b, c));
  const abD = sign(cross(a, b, d));
  const cdA = sign(cross(c, d, a));
  const cdB = sign(cross(c, d, b));
  if (abC !== abD && cdA !== cdB) return true;
  return (abC === 0 && pointOnSegment(c, a, b))
    || (abD === 0 && pointOnSegment(d, a, b))
    || (cdA === 0 && pointOnSegment(a, c, d))
    || (cdB === 0 && pointOnSegment(b, c, d));
}

export function polygonArea2(points) {
  let sum = 0;
  for (let index = 0; index < points.length; index++) {
    const next = points[(index + 1) % points.length];
    sum += points[index].x * next.y - next.x * points[index].y;
  }
  return Math.abs(sum);
}

export function classifyPointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0; index < polygon.length; index++) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (pointOnSegment(point, start, end)) return 'BOUNDARY';
    const crossesRay = (start.y > point.y) !== (end.y > point.y);
    if (crossesRay) {
      const intersectionX = start.x + ((point.y - start.y) * (end.x - start.x)) / (end.y - start.y);
      if (intersectionX > point.x) inside = !inside;
    }
  }
  return inside ? 'INSIDE' : 'OUTSIDE';
}

export function isSimplePolygon(points) {
  if (points.length < 3 || polygonArea2(points) <= EPSILON) return false;
  for (let first = 0; first < points.length; first++) {
    const firstNext = (first + 1) % points.length;
    for (let second = first + 1; second < points.length; second++) {
      const secondNext = (second + 1) % points.length;
      if (first === second || firstNext === second || secondNext === first) continue;
      if (segmentsIntersect(points[first], points[firstNext], points[second], points[secondNext])) return false;
    }
  }
  return true;
}

export function wouldCreateIntersection(path, candidate, closing = false) {
  if (path.length < 2) return false;
  const start = path.at(-1);
  const end = candidate;
  const firstEdge = closing ? 1 : 0;
  const edgeLimit = path.length - 2;
  for (let index = firstEdge; index < edgeLimit; index++) {
    if (segmentsIntersect(start, end, path[index], path[index + 1])) return true;
  }
  return false;
}

export function evaluateRegionRules(order, parameters) {
  const anchors = new Map(parameters.anchors.map(anchor => [anchor.id, anchor]));
  const polygon = order.map(id => anchors.get(id));
  if (polygon.some(point => !point) || new Set(order).size !== parameters.anchors.length || !isSimplePolygon(polygon)) {
    return { valid: false, area2: null, pairResults: [] };
  }
  const area2 = polygonArea2(polygon);
  const pairResults = parameters.beaconPairs.map(pair => {
    const classifications = pair.points.map(point => classifyPointInPolygon(point, polygon));
    return { id: pair.id, classifications, satisfied: classifications.filter(value => value === 'INSIDE').length === 1 && !classifications.includes('BOUNDARY') };
  });
  return {
    valid: (parameters.targetArea2 == null || area2 === parameters.targetArea2) && pairResults.every(result => result.satisfied),
    area2,
    pairResults
  };
}

export function solveLineRegion(parameters, { maxSolutions = Infinity } = {}) {
  const ids = parameters.anchors.map(anchor => anchor.id).sort();
  const first = ids[0];
  const solutions = [];
  let candidatesVisited = 0;

  function visit(path, remaining) {
    if (solutions.length >= maxSolutions) return;
    if (remaining.length === 0) {
      if (path[1].localeCompare(path.at(-1)) >= 0) return;
      candidatesVisited++;
      if (evaluateRegionRules(path, parameters).valid) solutions.push([...path]);
      return;
    }
    for (let index = 0; index < remaining.length; index++) {
      const id = remaining[index];
      visit([...path, id], [...remaining.slice(0, index), ...remaining.slice(index + 1)]);
    }
  }

  visit([first], ids.filter(id => id !== first));
  return { solutions, candidatesVisited };
}
