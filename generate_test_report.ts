import * as fs from 'fs';
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
import { PuzzleData, PuzzleType } from './src/models/PuzzleData.ts';

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

const difficulties = [2, 5, 8];
const diffLabels = { 2: "Easy", 5: "Medium", 8: "Hard" };

let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>Puzzle Generation Report</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #1a1a2e; color: #eee; padding: 20px; }
        h1 { text-align: center; color: #e74c3c; }
        .engine-section { margin-bottom: 50px; border-top: 3px solid #e74c3c; padding-top: 20px; }
        .puzzle-card { background: #2a2a4a; margin: 15px 0; padding: 15px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .puzzle-card h3 { margin-top: 0; color: #f1c40f; }
        .difficulty { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.8em; margin-left: 10px; background: #34495e; }
        .diff-2 { background: #27ae60; }
        .diff-5 { background: #d35400; }
        .diff-8 { background: #c0392b; }
        pre { background: #111; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.9em; white-space: pre-wrap; }
        .section-title { font-weight: bold; color: #3498db; margin-top: 10px; }
    </style>
</head>
<body>
    <h1>Puzzle Generation Structure Report</h1>
    <p style="text-align:center">This report shows the pure JSON structure of the generated puzzles across all categories and difficulties.</p>
`;

async function main() {
    for (const engine of engines) {
        const engineName = engine.constructor.name;
        const engineType = (engine as any).type || (engine as any).mechanic || (engine as any).puzzleType || 'unknown';
        html += `<div class="engine-section"><h2>⚙️ Category: ${String(engineType).toUpperCase()}</h2>`;
        
        for (const diff of difficulties) {
            let puzzle: PuzzleData | null = null;
            try {
                if (typeof (engine as any).generate === 'function') {
                    puzzle = (engine as any).generate(diff);
                    if (puzzle instanceof Promise) {
                        puzzle = await puzzle;
                    }
                } else if (typeof (engine as any).generateLogic === 'function') {
                    const logic = (engine as any).generateLogic(diff);
                    if (logic) {
                        puzzle = {
                            id: `constraint_${diff}`,
                            difficulty: diff,
                            seed: 0,
                            title: `Constraint Transfer Logic (Engine: ${engineName})`,
                            description: `Generated pure logic for ${engineName}`,
                            initial_state: logic,
                            goal_state: {},
                            hints: []
                        };
                    }
                }
            } catch (e: any) {
                html += `<div class="puzzle-card"><h3 style="color:red">Failed (Difficulty ${diffLabels[diff as keyof typeof diffLabels]})</h3><p>${e.message}</p></div>`;
                continue;
            }

            if (puzzle) {
                html += `
                <div class="puzzle-card">
                    <h3>${puzzle.title} <span class="difficulty diff-${diff}">${diffLabels[diff as keyof typeof diffLabels]} (Lv ${diff})</span></h3>
                    <div class="section-title">Narrative/Scenario:</div>
                    <p>${puzzle.narrative_setup || puzzle.description}</p>
                    <div class="section-title">Description (Rules):</div>
                    <p>${puzzle.description}</p>
                    
                    <div class="section-title">Initial State (Raw Structure):</div>
                    <pre>${JSON.stringify(puzzle.initial_state, null, 2)}</pre>
                    
                    <div class="section-title">Goal State (Raw Structure):</div>
                    <pre>${JSON.stringify(puzzle.goal_state, null, 2)}</pre>
                    
                    <div class="section-title">Hints:</div>
                    <pre>${puzzle.hints.join('\n')}</pre>
                </div>`;
            } else {
                html += `<div class="puzzle-card"><h3>No puzzle returned for Difficulty ${diffLabels[diff as keyof typeof diffLabels]}</h3></div>`;
            }
        }
        
        html += `</div>`;
    }

    html += `</body></html>`;

    fs.writeFileSync('puzzle_report.html', html, 'utf-8');
    console.log("Report generated at puzzle_report.html");
}

main().catch(console.error);
