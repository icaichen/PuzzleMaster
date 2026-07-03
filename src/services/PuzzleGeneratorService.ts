import { PuzzleData, PuzzleMechanic } from '../models/PuzzleData';
import { ConstraintTransferEngine } from '../engines/ConstraintTransferEngine';
import { ThemeGenerator } from './ThemeGenerator';

export class PuzzleGeneratorService {
  private constraintEngine = new ConstraintTransferEngine();

  async generatePuzzle(mechanic: PuzzleMechanic, difficulty: number, seed?: number): Promise<PuzzleData | null> {
    
    // 1. Generate pure math logic
    let logicData: any = null;
    if (mechanic === PuzzleMechanic.CONSTRAINT_TRANSFER) {
      logicData = this.constraintEngine.generateLogic(difficulty, seed);
    } else {
      throw new Error(`Mechanic ${mechanic} is not fully implemented yet in the new architecture.`);
    }

    if (!logicData) {
      return null;
    }

    // 2. Generate thematic skin via AI
    const skin = await ThemeGenerator.generateSkin(mechanic, logicData);

    // 3. Assemble the final PuzzleData payload
    return {
      id: `${mechanic}_${Date.now()}`,
      mechanic: mechanic,
      difficulty: difficulty,
      seed: seed ?? 0,
      theme: skin,
      initial_state: logicData, // The raw logic serves as the initial state constraint map
      goal_state: {}, // To be evaluated by the Layout/Solver
      hints: [
        "提示一：不要被表象迷惑，理清事物之间的互斥关系。",
        "提示二：注意载具的容量限制和驾驶要求。"
      ]
    };
  }
}
