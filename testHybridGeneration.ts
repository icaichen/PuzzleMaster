import { PuzzleGeneratorService } from './src/services/PuzzleGeneratorService.ts';
import { PuzzleMechanic } from './src/models/PuzzleData.ts';

// Add dotenv to load API key if there's a .env file locally for testing
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const generator = new PuzzleGeneratorService();
    
    console.log("=== Testing Hybrid AI Generation ===");
    console.log("Mechanic: CONSTRAINT_TRANSFER");
    console.log("Difficulty: 4");
    
    const puzzle = await generator.generatePuzzle(PuzzleMechanic.CONSTRAINT_TRANSFER, 4);
    
    if (puzzle) {
        console.log("\n✅ Puzzle Generated Successfully!\n");
        console.log("--- TITLE ---");
        console.log(puzzle.theme.title);
        console.log("\n--- NARRATIVE ---");
        console.log(puzzle.theme.narrative_setup);
        console.log("\n--- RULES ---");
        console.log(puzzle.theme.rules_description);
        
        console.log("\n--- ENTITY MAP (Logic -> Theme) ---");
        for (const [logicId, themeName] of Object.entries(puzzle.theme.entity_map)) {
            console.log(`  ${logicId} => ${themeName}`);
        }
        
        console.log("\n--- RAW LOGIC STATE (Layer 1 Math) ---");
        console.log(JSON.stringify(puzzle.initial_state, null, 2));
    } else {
        console.log("❌ Failed to generate puzzle");
    }
}

run();
