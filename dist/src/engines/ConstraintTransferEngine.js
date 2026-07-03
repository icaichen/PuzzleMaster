import { PuzzleMechanic } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
export class ConstraintTransferEngine {
    constructor() {
        this.mechanic = PuzzleMechanic.CONSTRAINT_TRANSFER;
        this.isBank = false;
        this.rng = new SeededRandom(0);
    }
    generateLogic(difficulty, seed) {
        const actualSeed = seed ?? SeededRandom.randomSeed();
        this.rng = new SeededRandom(actualSeed);
        // Generating pure math logic without any thematic strings.
        if (difficulty <= 5) {
            // Classic 4-element chain (e.g. Wolf-Sheep-Cabbage)
            // E_A acts as the implicit pilot/safeguard because it's not in the conflicts.
            return {
                entities: ['E_A', 'E_B', 'E_C', 'E_D'],
                locations: ['LOC_START', 'LOC_END'],
                carrier: { capacity: 2, requiresPilot: true, pilotEntities: ['E_A'] }, // Pilot required to move carrier
                conflicts: [
                    { predator: 'E_B', prey: 'E_C' }, // B eats C if A is absent
                    { predator: 'E_C', prey: 'E_D' } // C eats D if A is absent
                ]
            };
        }
        else {
            // 6-element complex chain (e.g. Jealous Husbands/Couples logic simplified)
            return {
                entities: ['E_A1', 'E_A2', 'E_B1', 'E_B2', 'E_C1', 'E_C2'],
                locations: ['LOC_START', 'LOC_END'],
                carrier: { capacity: 2, requiresPilot: true, pilotEntities: ['E_A1', 'E_B1', 'E_C1'] },
                conflicts: [
                    { predator: 'E_A1', prey: 'E_B2' },
                    { predator: 'E_A1', prey: 'E_C2' },
                    { predator: 'E_B1', prey: 'E_A2' },
                    { predator: 'E_B1', prey: 'E_C2' },
                    { predator: 'E_C1', prey: 'E_A2' },
                    { predator: 'E_C1', prey: 'E_B2' },
                ]
            };
        }
    }
}
//# sourceMappingURL=ConstraintTransferEngine.js.map