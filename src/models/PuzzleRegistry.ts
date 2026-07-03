/**
 * PuzzleRegistry.ts — 谜题引擎注册中心
 *
 * 所有引擎在这里注册。GameManager 只通过 Registry 生成谜题，
 * 不导入任何具体引擎。
 *
 * 支持每个 PuzzleType 注册一个主引擎（PCG）+ 一个后备引擎（bank）。
 * generate() 优先尝试主引擎，失败则回退到后备。
 */

import { PuzzleType, PuzzleEngine, PuzzleData, PuzzleMechanic, getCategoriesForDifficulty } from './PuzzleData';
import { SeededRandom } from './SeededRandom';
import { SlidingBlockEngine } from '../engines/SlidingBlockEngine';
import { LogicGridEngine } from '../engines/LogicGridEngine';
import { TemplateEngine } from '../engines/TemplateEngine';
import { MatchstickEngine } from '../engines/MatchstickEngine';
import { WeighingEngine } from '../engines/WeighingEngine';

import { PathEngine } from '../engines/PathEngine';
import { NumberGridEngine } from '../engines/NumberGridEngine';
import { TangramEngine } from '../engines/TangramEngine';
import { LLMPuzzleEngine } from '../engines/LLMPuzzleEngine';
import { PuzzleBankLoader } from './PuzzleBankLoader';
import { PuzzleGeneratorService } from '../services/PuzzleGeneratorService';

/** 题库包装器 */
class BankEngine implements PuzzleEngine {
  readonly isBank = true;

  constructor(
    readonly type: PuzzleType,
    private loader: PuzzleBankLoader
  ) {}

  generate(difficulty: number, seed?: number): PuzzleData | null {
    const bankDifficulty = Math.min(5, Math.ceil(difficulty / 2));
    return this.loader.getRandomPuzzle(this.type, bankDifficulty, seed);
  }
}

/** River Crossing AI/PCG 包装器 */
class RiverCrossingWrapperEngine implements PuzzleEngine {
  constructor(private service: PuzzleGeneratorService) {}

  async generate(difficulty: number, seed?: number): Promise<PuzzleData | null> {
    const puzzle = await this.service.generatePuzzle(PuzzleMechanic.CONSTRAINT_TRANSFER, difficulty, seed);
    if (puzzle) {
      puzzle.type = PuzzleType.RIVER_CROSSING;
    }
    return puzzle;
  }
}

/** 每个类别有一个主引擎和可选后备 */
interface EngineSlot {
  primary: PuzzleEngine;
  fallback?: PuzzleEngine;
}

export class PuzzleRegistry {
  private slots: Map<PuzzleType, EngineSlot> = new Map();

  constructor() {
    // Bank loader shared across all bank engines
    const bank = new PuzzleBankLoader();
    const puzzleGenService = new PuzzleGeneratorService();

    // ─── PCG 引擎 ───────────────────────────────────────
    this.setPrimary(PuzzleType.SLIDING_BLOCK, new SlidingBlockEngine());
    this.setPrimary(PuzzleType.LOGIC_GRID, new LogicGridEngine());
    
    // MATH: Primary AI generation, fallback to Template generator
    this.setPrimary(PuzzleType.MATH, new LLMPuzzleEngine(PuzzleType.MATH));
    this.setFallback(PuzzleType.MATH, new TemplateEngine());

    this.setPrimary(PuzzleType.MATCHSTICK, new MatchstickEngine());
    this.setPrimary(PuzzleType.WEIGHING, new WeighingEngine());

    this.setPrimary(PuzzleType.PATH_FINDING, new PathEngine());
    this.setPrimary(PuzzleType.NUMBER_GRID, new NumberGridEngine());
    this.setPrimary(PuzzleType.JIGSAW, new TangramEngine());
    
    // RIVER_CROSSING: Visual interactive constraint transfer
    this.setPrimary(PuzzleType.RIVER_CROSSING, new RiverCrossingWrapperEngine(puzzleGenService));

    // ─── Layton AI 引擎 + 纯题库后备 ─────────────────────
    this.setPrimary(PuzzleType.LATERAL_THINKING, new LLMPuzzleEngine(PuzzleType.LATERAL_THINKING));
    this.setFallback(PuzzleType.LATERAL_THINKING, new BankEngine(PuzzleType.LATERAL_THINKING, bank));

    this.setPrimary(PuzzleType.WORD_PLAY, new LLMPuzzleEngine(PuzzleType.WORD_PLAY));
    this.setFallback(PuzzleType.WORD_PLAY, new BankEngine(PuzzleType.WORD_PLAY, bank));

    this.setPrimary(PuzzleType.MEASUREMENT, new LLMPuzzleEngine(PuzzleType.MEASUREMENT));
    this.setFallback(PuzzleType.MEASUREMENT, new BankEngine(PuzzleType.MEASUREMENT, bank));

    // TODO: add remaining PCG engines
    // this.setPrimary(PuzzleType.PATTERN, new PatternEngine());
  }

  private setPrimary(type: PuzzleType, engine: PuzzleEngine): void {
    this.slots.set(type, { primary: engine });
  }

  private setFallback(type: PuzzleType, engine: PuzzleEngine): void {
    const slot = this.slots.get(type);
    if (slot) {
      slot.fallback = engine;
    } else {
      this.slots.set(type, { primary: engine }); // fallback becomes primary if no primary exists
    }
  }

  /**
   * 生成指定类型的谜题。先尝试主引擎，失败则试后备。
   */
  async generate(type: PuzzleType, difficulty: number, seed?: number): Promise<PuzzleData | null> {
    const slot = this.slots.get(type);
    if (!slot) return null;

    let puzzle = (slot.primary as any).generate ? (slot.primary as any).generate(difficulty, seed) : null;
    if (puzzle instanceof Promise) {
      puzzle = await puzzle;
    }
    if (puzzle) return puzzle;

    if (slot.fallback) {
      let fallbackPuzzle = (slot.fallback as any).generate ? (slot.fallback as any).generate(difficulty, seed) : null;
      if (fallbackPuzzle instanceof Promise) {
        fallbackPuzzle = await fallbackPuzzle;
      }
      return fallbackPuzzle;
    }

    return null;
  }

  /**
   * 从当前难度可用的类别中随机选一个类型生成谜题。
   */
  async generateRandom(difficulty: number, seed?: number): Promise<PuzzleData | null> {
    const categories = getCategoriesForDifficulty(difficulty);
    const available = categories.filter(c => this.slots.has(c));
    if (available.length === 0) return null;

    const actualSeed = seed ?? SeededRandom.randomSeed();
    const localRng = new SeededRandom(actualSeed);

    const shuffled = localRng.shuffle(available);
    for (const type of shuffled) {
      const puzzle = await this.generate(type, difficulty, actualSeed);
      if (puzzle) return puzzle;
    }

    return null;
  }

  getRegisteredTypes(): PuzzleType[] {
    return [...this.slots.keys()];
  }

  get engineCount(): number {
    return this.slots.size;
  }
}
