import { generateTemperatureBatch } from './lib/temperature-swap-route.mjs';

const seed = process.argv[2] ?? 'nav-03-sample';
const count = Number(process.argv[3] ?? 5);
if (!Number.isInteger(count) || count < 1 || count > 50) {
  throw new Error('Count must be an integer between 1 and 50');
}

const batch = generateTemperatureBatch(seed, count);
console.log(JSON.stringify({
  mechanism: 'NAV-03',
  seed,
  count: batch.length,
  candidates: batch
}, null, 2));

