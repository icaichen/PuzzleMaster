import { LogicGridEngine } from './src/engines/LogicGridEngine.ts';
import { MatchstickEngine } from './src/engines/MatchstickEngine.ts';
import { NumberGridEngine } from './src/engines/NumberGridEngine.ts';
import { PathEngine } from './src/engines/PathEngine.ts';
import { ConstraintTransferEngine } from './src/engines/ConstraintTransferEngine.ts';
import { SlidingBlockEngine } from './src/engines/SlidingBlockEngine.ts';
import { TangramEngine } from './src/engines/TangramEngine.ts';
import { TemplateEngine } from './src/engines/TemplateEngine.ts';
import { WeighingEngine } from './src/engines/WeighingEngine.ts';
import { LLMPuzzleEngine } from './src/engines/LLMPuzzleEngine.ts';
import { PuzzleType } from './src/models/PuzzleData.ts';

const engines = [
    new LogicGridEngine(),
    new MatchstickEngine(),
    new NumberGridEngine(),
    new PathEngine(),
    new ConstraintTransferEngine(),
    new SlidingBlockEngine(),
    new TangramEngine(),
    new TemplateEngine(),
    new WeighingEngine(),
    new LLMPuzzleEngine(PuzzleType.LATERAL_THINKING)
];

console.log("=== Testing All Engines ===");
for (const engine of engines) {
    try {
        const engineName = engine.constructor.name;
        const engineType = (engine as any).type || (engine as any).mechanic || (engine as any).puzzleType || 'unknown';
        console.log(`\nTesting ${engineName} (${engineType})...`);
        
        let puzzle: any = null;
        if (typeof (engine as any).generate === 'function') {
            puzzle = (engine as any).generate(5);
            if (puzzle instanceof Promise) {
                puzzle = await puzzle;
            }
        } else if (typeof (engine as any).generateLogic === 'function') {
            const logic = (engine as any).generateLogic(5);
            if (logic) {
                puzzle = {
                    title: `Constraint Transfer Logic (Engine: ${engineName})`,
                    description: `Generated pure logic for ${engineName}`,
                    initial_state: logic,
                    goal_state: {},
                    hints: []
                };
            }
        }

        if (puzzle) {
            console.log(`✅ Success! Title: ${puzzle.title}`);
            console.log(`Preview: ${String(puzzle.description || '').substring(0, 100)}...`);
        } else {
            console.log(`❌ Failed to generate (returned null)`);
        }
    } catch (e: any) {
        console.log(`❌ Error: ${e.message}`);
    }
}
