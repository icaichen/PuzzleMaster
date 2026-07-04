export function carrierPosition(carrier, tick) {
  const index = ((carrier.phase + carrier.speed * tick) % carrier.route.length + carrier.route.length) % carrier.route.length;
  return carrier.route[index];
}

export function carriersAtStation(carriers, station, tick) {
  return carriers.filter(carrier => carrierPosition(carrier, tick) === station);
}

export function greatestCommonDivisor(a, b) {
  while (b !== 0) [a, b] = [b, a % b];
  return Math.abs(a);
}

export function leastCommonMultiple(a, b) {
  return Math.abs(a * b) / greatestCommonDivisor(a, b);
}

export function schedulePeriod(carriers) {
  return carriers.reduce((period, carrier) => leastCommonMultiple(period, carrier.route.length / greatestCommonDivisor(carrier.route.length, carrier.speed)), 1);
}

