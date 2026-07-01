import { PuzzleData, PuzzleType } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';

export class LLMEngine {
  private rng: SeededRandom = new SeededRandom(SeededRandom.randomSeed());

  generatePuzzle(seed?: number): PuzzleData {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);

    const riddles = [
      {
        title: "The Silent Watcher",
        description: "I have no eyes, yet I see every movement you make. I have no voice, yet I can echo your every word in the right light. What am I?",
        answer: "mirror"
      },
      {
        title: "The Endless Journey",
        description: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. I have roads, but no cars. What am I?",
        answer: "map"
      },
      {
        title: "The Hidden Truth",
        description: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        answer: "echo"
      }
    ];

    const selectedRiddle = this.rng.pick(riddles);

    return {
      id: `riddle_${actualSeed}`,
      type: PuzzleType.LATERAL_THINKING,
      difficulty: 5,
      title: selectedRiddle.title,
      description: selectedRiddle.description,
      initial_state: {},
      goal_state: { answer: selectedRiddle.answer },
      hints: [],
      seed: actualSeed
    };
  }
}
