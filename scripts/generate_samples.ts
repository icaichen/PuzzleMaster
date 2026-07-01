import { KlotskiEngine } from '../src/engines/KlotskiEngine';
import { LogicGridEngine } from '../src/engines/LogicGridEngine';
import { NumberGridEngine } from '../src/engines/NumberGridEngine';
import { PathEngine } from '../src/engines/PathEngine';
import { LLMEngine } from '../src/engines/LLMEngine';
import { PuzzleData } from '../src/models/PuzzleData';

async function main() {
    console.log("=========================================");
    console.log("   Layer 1 + Layer 2 Integration Test");
    console.log("=========================================\n");

    const llmEngine = new LLMEngine();
    
    // Instantiate Layer 1 Generators
    const engines = [
        new KlotskiEngine(),
        new LogicGridEngine(),
        new NumberGridEngine(),
        new PathEngine()
    ];

    const difficulty = 5;

    for (const engine of engines) {
        console.log(`\n>>> Generating Base Mechanism [${engine.type}] (Layer 1)...`);
        const basePuzzle = engine.generate(difficulty);
        
        if (!basePuzzle) {
            console.log("Generation failed for this engine.");
            continue;
        }

        console.log(`[Layer 1 Output] ID: ${basePuzzle.id}`);
        console.log(`- Title: ${basePuzzle.title || 'N/A'}`);
        console.log(`- Base Description (Math/Logic): ${basePuzzle.description.substring(0, 80)}...`);
        // Omit initial_state print as it's huge
        
        console.log(`\n>>> Rendering Narrative & Visuals via LLMEngine (Layer 2)...`);
        const enrichedPuzzle = await llmEngine.enrichPuzzle(basePuzzle);

        console.log(`[Layer 2 Enriched Output]`);
        console.log(`- Scene Theme:      ${enrichedPuzzle.scene_theme}`);
        console.log(`- Title:            ${enrichedPuzzle.title}`);
        console.log(`- Narrative Setup:  ${enrichedPuzzle.narrative_setup}`);
        console.log(`- Base Description: ${enrichedPuzzle.description.substring(0, 80)}...`);
        
        console.log(`- Visual Elements Map:`);
        enrichedPuzzle.visual_elements?.forEach(v => {
            console.log(`    * [${v.type.toUpperCase()}] ${v.id} -> maps to mechanism position '${v.position}' (State: ${v.state})`);
        });

        console.log(`- Integrated Hints:`);
        enrichedPuzzle.integrated_hints?.forEach((h, i) => {
            console.log(`    Hint ${i+1}: ${h}`);
        });
        
        console.log("\n-------------------------------------------------");
    }
}

main().catch(console.error);
