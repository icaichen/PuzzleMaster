/**
 * MatchstickEngine.ts — 火柴棒谜题引擎
 *
 * 生成「移动 N 根火柴棒使等式成立」类谜题。
 *
 * 策略：预置精选谜题库 + 程序化变体。
 * 匹配棒数字使用简体中文常见字形计数。
 */

import { PuzzleData, PuzzleType, PuzzleEngine } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
import { StoryGenerator } from '../models/StoryGenerator';

interface MatchstickPuzzle {
  equation: string;     // 显示的（错误）等式，如 "6 + 4 = 4"
  answer: string;       // 正确答案，如 "0 + 4 = 4"
  moves: number;        // 需要移动的火柴棒数量
  hint: string;         // 提示
}

// 精选火柴棒谜题库
const MATCHSTICK_BANK: MatchstickPuzzle[] = [
  // ── 移动 1 根 ──
  { equation: '6 + 4 = 4',      answer: '0 + 4 = 4',      moves: 1, hint: '把 6 变成 0' },
  { equation: '8 + 1 = 1',      answer: '6 + 1 = 7',      moves: 1, hint: '把 8 和后面的 1 各取一根' },
  { equation: '5 + 7 = 2',      answer: '5 + 1 = 6',      moves: 1, hint: '把 7 的一根移到 2' },
  { equation: '9 + 2 = 6',      answer: '5 + 2 = 7',      moves: 1, hint: '把 9 变成 5，6 变成 7' },
  { equation: '0 + 1 = 8',      answer: '0 + 7 = 7',      moves: 1, hint: '把 1 加到 8 上' },
  { equation: '3 + 3 = 8',      answer: '9 + 3 = 12',     moves: 1, hint: '把 3 变 9，8 变 12（移动一根到等号右边）' },
  { equation: '1 + 2 = 8',      answer: '7 + 2 = 9',      moves: 1, hint: '1 变 7，8 变 9' },
  { equation: '4 + 2 = 7',      answer: '4 + 3 = 7',      moves: 1, hint: '把 2 变成 3' },
  { equation: '6 + 3 = 5',      answer: '8 - 3 = 5',      moves: 1, hint: '把 + 变成 -，6 变成 8' },
  { equation: '9 - 1 = 4',      answer: '3 + 1 = 4',      moves: 1, hint: '把 9 变成 3，- 变成 +' },

  // ── 移动 2 根 ──
  { equation: '4 + 9 = 1',      answer: '4 + 3 = 7',      moves: 2, hint: '9 变 3，1 变 7' },
  { equation: '6 - 4 = 3',      answer: '6 - 4 = 2',      moves: 2, hint: '重新排列 3 变成 2' },
  { equation: '1 + 4 = 9',      answer: '7 - 4 = 3',      moves: 2, hint: '1 变 7，9 变 3，+ 变 -' },
  { equation: '8 - 3 = 3',      answer: '9 - 3 = 6',      moves: 2, hint: '8 变 9，后面 3 变 6' },
];

export class MatchstickEngine implements PuzzleEngine {
  readonly type = PuzzleType.MATCHSTICK;
  readonly isBank = false;

  private rng: SeededRandom = new SeededRandom(0);

  generate(difficulty: number, seed?: number): PuzzleData | null {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);

    // Filter by difficulty-appropriate move count
    let candidates: MatchstickPuzzle[];
    if (difficulty <= 3) {
      candidates = MATCHSTICK_BANK.filter(p => p.moves === 1);
    } else if (difficulty <= 7) {
      candidates = MATCHSTICK_BANK.filter(p => p.moves === 1 || p.moves === 2);
    } else {
      candidates = MATCHSTICK_BANK.filter(p => p.moves === 2);
    }

    if (candidates.length === 0) return null;

    const puzzle = this.rng.pick(candidates);

    const storyGen = new StoryGenerator(actualSeed);
    const story = storyGen.generate(
      PuzzleType.MATCHSTICK,
      `火柴棒谜题 · ${puzzle.moves === 1 ? '一星' : '二星'}`,
      undefined,
      `移动 ${puzzle.moves} 根火柴棒，使等式成立：\n\n    ${puzzle.equation}\n\n（火柴棒数字按七段数码管显示）`
    );

    return {
      id: `matchstick_${actualSeed}`,
      type: PuzzleType.MATCHSTICK,
      difficulty: Math.min(10, difficulty + (puzzle.moves - 1) * 3),
      title: story.title,
      description: story.question, // description matches layout expected rule/goal text
      narrative_setup: story.scenario, // narrative_setup matches layout expected background story
      initial_state: {
        question: story.question,
        equation: puzzle.equation,
        moves: puzzle.moves,
      },
      goal_state: { answer: puzzle.answer },
      hints: [
        `提示一：注意观察哪些数字只需要改变一根火柴棒就能变成另一个数字。`,
        `提示二：${puzzle.hint}`,
        `提示三：正确答案是 ${puzzle.answer}。`,
      ],
      seed: actualSeed,
    };
  }
}
