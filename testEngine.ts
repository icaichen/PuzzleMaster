import { LogicGridEngine } from './src/engines/LogicGridEngine.ts';

const engine = new LogicGridEngine();

console.log("=== Generating Easy Puzzle (Lv 2) ===");
console.time("Easy");
const easyPuzzle = engine.generatePuzzle(2);
console.timeEnd("Easy");
console.log(`Clues count: ${easyPuzzle.initial_state.clues.length}`);
console.log(easyPuzzle.initial_state.clues.slice(0, 5).join('\n') + '...\n');

console.log("=== Generating Medium Puzzle (Lv 5) ===");
console.time("Medium");
const medPuzzle = engine.generatePuzzle(5);
console.timeEnd("Medium");
console.log(`Clues count: ${medPuzzle.initial_state.clues.length}`);
console.log(medPuzzle.initial_state.clues.slice(0, 5).join('\n') + '...\n');

console.log("=== Generating Hard Puzzle (Lv 8) ===");
console.time("Hard");
const hardPuzzle = engine.generatePuzzle(8);
console.timeEnd("Hard");
console.log(`Clues count: ${hardPuzzle.initial_state.clues.length}`);
console.log(hardPuzzle.initial_state.clues.slice(0, 5).join('\n') + '...\n');

console.log("Sample Goal State (Truth):");
console.log(JSON.stringify(hardPuzzle.goal_state.truth, null, 2));
