import * as fs from 'fs';

interface BankPuzzle {
  id: string; type: string; category: string; difficulty: number;
  picarat: number; title: string; scenario: string; question: string;
  answer: string; hints: string[]; tags: string[];
}

const raw = fs.readFileSync('data/puzzleBank.json', 'utf-8');
const bank = JSON.parse(raw);
const puzzles: BankPuzzle[] = bank.puzzles;

console.log('=== PUZZLE BANK QUALITY AUDIT ===\n');
console.log('Total puzzles:', puzzles.length);

// 1. Basic fields
const issues: string[] = [];
const ids = new Set<string>();

for (const p of puzzles) {
  const pref = p.id || '???';

  if (!p.id) issues.push('missing id');
  if (!p.title?.trim()) issues.push(pref + ': empty title');
  if (!p.scenario?.trim()) issues.push(pref + ': empty scenario');
  if (!p.question?.trim()) issues.push(pref + ': empty question');
  if (!p.answer?.trim()) issues.push(pref + ': empty answer');
  if (!Array.isArray(p.hints) || p.hints.length === 0) issues.push(pref + ': missing hints');
  if (typeof p.difficulty !== 'number' || p.difficulty < 1 || p.difficulty > 5)
    issues.push(pref + ': bad difficulty=' + p.difficulty);
  if (!p.picarat) issues.push(pref + ': missing picarat');
  if (!p.category) issues.push(pref + ': missing category');
  if (ids.has(p.id)) issues.push(pref + ': DUPLICATE ID');
  ids.add(p.id);
}

console.log('\n--- Field Issues ---');
if (issues.length === 0) console.log('  OK - All 100 puzzles complete');
else {
  console.log('  ' + issues.length + ' issues:');
  issues.forEach(i => console.log('    ' + i));
}

// 2. Category distribution
const cats: Record<string, { count: number; diffs: number[] }> = {};
for (const p of puzzles) {
  const cat = p.category || 'UNKNOWN';
  if (!cats[cat]) cats[cat] = { count: 0, diffs: [] };
  cats[cat].count++;
  cats[cat].diffs.push(p.difficulty);
}

console.log('\n--- Category Distribution ---');
for (const [cat, info] of Object.entries(cats)) {
  const avg = (info.diffs.reduce((a, b) => a + b, 0) / info.diffs.length).toFixed(1);
  console.log('  ' + cat + ': ' + info.count + ' (diff ' + Math.min(...info.diffs) + '-' + Math.max(...info.diffs) + ', avg ' + avg + ')');
}

// 3. Hint depth check
const hintCounts = [0, 0, 0, 0, 0, 0]; // 0-5+
for (const p of puzzles) {
  const n = p.hints?.length || 0;
  if (n < 6) hintCounts[n]++; else hintCounts[5]++;
}
console.log('\n--- Hint Depth ---');
for (let i = 0; i <= 5; i++) {
  if (hintCounts[i] > 0) console.log('  ' + i + ' hints: ' + hintCounts[i] + ' puzzles');
}

// 4. Short/long fields
const shortScenarios = puzzles.filter(p => (p.scenario?.length || 0) < 30);
const longAnswers = puzzles.filter(p => (p.answer?.length || 0) > 300);
const shortAnswers = puzzles.filter(p => {
  const a = p.answer || '';
  return a.length > 0 && a.length < 5;
});

console.log('\n--- Short Scenarios (<30 chars): ' + shortScenarios.length + ' ---');
shortScenarios.forEach(p => console.log('  ' + p.id + ': ' + p.scenario));

console.log('\n--- Very Short Answers (<5 chars): ' + shortAnswers.length + ' ---');
shortAnswers.forEach(p => console.log('  ' + p.id + ': "' + p.answer + '"'));

console.log('\n--- Very Long Answers (>300 chars): ' + longAnswers.length + ' ---');
longAnswers.forEach(p => console.log('  ' + p.id + ': ' + p.title + ' (' + p.answer.length + ' chars)'));

// 5. Print 5 sample puzzles for manual review
console.log('\n========================================================================');
console.log('SAMPLE PUZZLES FOR MANUAL REVIEW');
console.log('========================================================================');
const indices = [0, 10, 25, 42, 50, 67, 75, 88, 95, 99];
for (const idx of indices) {
  const p = puzzles[idx];
  if (!p) continue;
  console.log('\n--- [' + p.id + '] ' + p.title + '  [' + p.category + ']  diff=' + p.difficulty + '  ★' + p.picarat);
  console.log('Scenario: ' + p.scenario);
  console.log('Question: ' + p.question);
  console.log('Answer:   ' + p.answer);
  console.log('Hints:');
  p.hints.forEach((h, i) => console.log('  ' + (i + 1) + '. ' + h));
}

console.log('\n=== AUDIT COMPLETE ===');
