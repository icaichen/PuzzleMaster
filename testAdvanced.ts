import { LogicGridEngine } from './src/engines/LogicGridEngine.ts';

const engine = new LogicGridEngine();

console.log("=== Generating Advanced Logic Puzzle (Lv 8) ===");
console.time("Hard");
const hardPuzzle = engine.generatePuzzle(8);
console.timeEnd("Hard");
console.log(`Clues count: ${hardPuzzle.initial_state.clues.length}`);
console.log(hardPuzzle.initial_state.clues.join('\n'));

console.log("\nSample Goal State (Truth):");
console.table(hardPuzzle.goal_state.truth);
