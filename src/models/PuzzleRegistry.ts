/**
 * PuzzleRegistry.ts — 谜题引擎注册中心
 *
 * 所有引擎在这里注册。GameManager 只通过 Registry 生成谜题，
 * 不导入任何具体引擎。
 *
 * 支持每个 PuzzleType 注册一个主引擎（PCG）+ 一个后备引擎（bank）。
 * generate() 优先尝试主引擎，失败则回退到后备。
 */

import { PuzzleType, PuzzleEngine, PuzzleData, getCategoriesForDifficulty } from './PuzzleData';
import { SeededRandom } from './SeededRandom';
import { KlotskiEngine } from '../engines/KlotskiEngine';
import { LogicGridEngine } from '../engines/LogicGridEngine';
import { TemplateEngine } from '../engines/TemplateEngine';
import { MatchstickEngine } from '../engines/MatchstickEngine';
import { WeighingEngine } from '../engines/WeighingEngine';
import { RiverCrossingEngine } from '../engines/RiverCrossingEngine';
import { PathEngine } from '../engines/PathEngine';
import { NumberGridEngine } from '../engines/NumberGridEngine';
import { TangramEngine } from '../engines/TangramEngine';
import { PuzzleBankLoader } from './PuzzleBankLoader';

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

    // ─── PCG 引擎 ───────────────────────────────────────
    this.setPrimary(PuzzleType.SLIDING_BLOCK, new KlotskiEngine());
    this.setPrimary(PuzzleType.LOGIC_GRID, new LogicGridEngine());
    this.setPrimary(PuzzleType.MATH, new TemplateEngine());
    this.setPrimary(PuzzleType.MATCHSTICK, new MatchstickEngine());
    this.setPrimary(PuzzleType.WEIGHING, new WeighingEngine());
    this.setPrimary(PuzzleType.RIVER_CROSSING, new RiverCrossingEngine());
    this.setPrimary(PuzzleType.PATH_FINDING, new PathEngine());
    this.setPrimary(PuzzleType.NUMBER_GRID, new NumberGridEngine());
    this.setPrimary(PuzzleType.JIGSAW, new TangramEngine());

    // ─── 纯题库类别（无 PCG） ────────────────────────────
    this.setPrimary(PuzzleType.LATERAL_THINKING, new BankEngine(PuzzleType.LATERAL_THINKING, bank));
    this.setPrimary(PuzzleType.WORD_PLAY, new BankEngine(PuzzleType.WORD_PLAY, bank));

    // ─── 有 PCG 的类别，题库作为后备 ─────────────────────
    // MATH: bank has 18 math_puzzle entries
    this.setFallback(PuzzleType.MATH, new BankEngine(PuzzleType.MATH, bank));
    // MEASUREMENT: bank has 8 entries, PCG engine coming soon
    this.setPrimary(PuzzleType.MEASUREMENT, new BankEngine(PuzzleType.MEASUREMENT, bank));

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
  generate(type: PuzzleType, difficulty: number, seed?: number): PuzzleData | null {
    const slot = this.slots.get(type);
    if (!slot) return null;

    const puzzle = slot.primary.generate(difficulty, seed);
    if (puzzle) return puzzle;

    if (slot.fallback) {
      return slot.fallback.generate(difficulty, seed);
    }

    return null;
  }

  /**
   * 从当前难度可用的类别中随机选一个类型生成谜题。
   */
  generateRandom(difficulty: number, seed?: number): PuzzleData | null {
    const categories = getCategoriesForDifficulty(difficulty);
    const available = categories.filter(c => this.slots.has(c));
    if (available.length === 0) return null;

    const actualSeed = seed ?? SeededRandom.randomSeed();
    const localRng = new SeededRandom(actualSeed);

    const shuffled = localRng.shuffle(available);
    for (const type of shuffled) {
      const puzzle = this.generate(type, difficulty, actualSeed);
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
