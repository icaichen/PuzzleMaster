import { LogicGridEngine } from './src/engines/LogicGridEngine.ts';
import { MatchstickEngine } from './src/engines/MatchstickEngine.ts';
import { NumberGridEngine } from './src/engines/NumberGridEngine.ts';
import { PathEngine } from './src/engines/PathEngine.ts';
import { RiverCrossingEngine } from './src/engines/RiverCrossingEngine.ts';
import { SlidingBlockEngine } from './src/engines/SlidingBlockEngine.ts';
import { TangramEngine } from './src/engines/TangramEngine.ts';
import { TemplateEngine } from './src/engines/TemplateEngine.ts';
import { WeighingEngine } from './src/engines/WeighingEngine.ts';

const engines = [
    new LogicGridEngine(),
    new MatchstickEngine(),
    new NumberGridEngine(),
    new PathEngine(),
    new RiverCrossingEngine(),
    new SlidingBlockEngine(),
    new TangramEngine(),
    new TemplateEngine(),
    new WeighingEngine()
];

console.log("=== Testing All Engines ===");
for (const engine of engines) {
    try {
        console.log(`\nTesting ${engine.type}...`);
        const puzzle = engine.generate(5);
        if (puzzle) {
            console.log(`✅ Success! Title: ${puzzle.title}`);
            console.log(`Preview: ${puzzle.description.substring(0, 100)}...`);
        } else {
            console.log(`❌ Failed to generate (returned null)`);
        }
    } catch (e: any) {
        console.log(`❌ Error: ${e.message}`);
    }
}
