/**
 * NumberGridEngine.ts — 不等号数独 / Futoshiki 谜题生成器
 *
 * 生成 N×N 拉丁方阵谜题，配合不等式约束。
 * 玩家填充空格使每行每列数字不重复且满足所有不等号。
 */

import { PuzzleType, PuzzleData, PuzzleEngine } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
import { StoryGenerator } from '../models/StoryGenerator';

export interface NumberGridState {
  /** Grid size (3, 4, or 5) */
  size: number;
  /** Grid values: 0 = empty cell, 1..size = pre-filled clue */
  grid: number[][];
  /** Solution: completed grid */
  solution: number[][];
  /**
   * Inequality constraints.
   * Each constraint: [r1, c1, r2, c2] means cell(r1,c1) < cell(r2,c2)
   * Only between orthogonally adjacent cells.
   */
  constraints: [number, number, number, number][];
  /** Player's current input grid (starts as copy of clues) */
  playerGrid?: number[][];
}

export class NumberGridEngine implements PuzzleEngine {
  readonly type = PuzzleType.NUMBER_GRID;
  readonly isBank = false;
  private rng = new SeededRandom(0);

  generate(difficulty: number, seed?: number): PuzzleData | null {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);

    const size = this.sizeForDifficulty(difficulty);
    const solution = this.generateLatinSquare(size);
    const clues = this.removeCells(solution, size, difficulty);
    const constraints = this.generateConstraints(solution, size, difficulty);

    const state: NumberGridState = {
      size,
      grid: clues,
      solution,
      constraints,
    };

    const digits = size === 3 ? '1~3' : size === 4 ? '1~4' : '1~5';

    const storyGen = new StoryGenerator(actualSeed);
    const story = storyGen.generate(
      PuzzleType.NUMBER_GRID,
      '不等号数独',
      undefined,
      `在 ${size}×${size} 的网格中填入数字 ${digits}，使每行每列不重复，并满足所有 > < 约束。`
    );

    return {
      id: `numgrid_${size}_${actualSeed}`,
      type: PuzzleType.NUMBER_GRID,
      difficulty,
      title: story.title,
      description: story.question, // description matches layout expected rule/goal text
      narrative_setup: story.scenario, // narrative_setup matches layout expected background story
      initial_state: state,
      goal_state: { solution },
      hints: this.generateHints(difficulty, size),
      seed: actualSeed,
    };
  }

  // ─── Difficulty ─────────────────────────────────────────

  private sizeForDifficulty(d: number): number {
    if (d <= 3) return 3;
    if (d <= 7) return 4;
    return 5;
  }

  private removeRatio(d: number): number {
    if (d <= 3) return 0.45;  // keep 55% as clues
    if (d <= 7) return 0.55;  // keep 45%
    return 0.65;               // keep 35%
  }

  private constraintRatio(d: number): number {
    if (d <= 3) return 0.25;
    if (d <= 7) return 0.4;
    return 0.55;
  }

  // ─── Latin square generation ────────────────────────────

  private generateLatinSquare(size: number): number[][] {
    // Start with ordered rows, then shuffle
    const grid: number[][] = [];
    for (let r = 0; r < size; r++) {
      grid.push([]);
      for (let c = 0; c < size; c++) {
        grid[r].push(((r + c) % size) + 1);
      }
    }

    // Shuffle rows and columns
    const rowOrder = this.rng.shuffle([...Array(size).keys()]);
    const colOrder = this.rng.shuffle([...Array(size).keys()]);

    const result: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[r][c] = grid[rowOrder[r]][colOrder[c]];
      }
    }

    // Randomly remap numbers (permute 1..size)
    const perm = this.rng.shuffle([...Array(size).keys()].map(i => i + 1));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        result[r][c] = perm[result[r][c] - 1];
      }
    }

    return result;
  }

  // ─── Clue removal ───────────────────────────────────────

  private removeCells(solution: number[][], size: number, difficulty: number): number[][] {
    const ratio = this.removeRatio(difficulty);
    const allCells: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        allCells.push([r, c]);
      }
    }

    const shuffled = this.rng.shuffle(allCells);
    const removeCount = Math.floor(shuffled.length * ratio);
    const removeSet = new Set<string>();
    for (let i = 0; i < removeCount; i++) {
      removeSet.add(`${shuffled[i][0]},${shuffled[i][1]}`);
    }

    // Ensure at least 1 clue per row and column
    const rowsWithClues = new Set<number>();
    const colsWithClues = new Set<number>();

    const clues: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!removeSet.has(`${r},${c}`)) {
          clues[r][c] = solution[r][c];
          rowsWithClues.add(r);
          colsWithClues.add(c);
        }
      }
    }

    // Fix rows/cols with no clues
    for (let r = 0; r < size; r++) {
      if (!rowsWithClues.has(r)) {
        const c = Math.floor(this.rng.next() * size);
        clues[r][c] = solution[r][c];
      }
    }
    for (let c = 0; c < size; c++) {
      if (!colsWithClues.has(c)) {
        // Find a row where this cell is empty
        for (let r = 0; r < size; r++) {
          if (clues[r][c] === 0) {
            clues[r][c] = solution[r][c];
            break;
          }
        }
      }
    }

    return clues;
  }

  // ─── Constraint generation ──────────────────────────────

  private generateConstraints(
    solution: number[][],
    size: number,
    difficulty: number,
  ): [number, number, number, number][] {
    const ratio = this.constraintRatio(difficulty);
    const constraints: [number, number, number, number][] = [];

    // Collect all orthogonal adjacent pairs
    const pairs: [number, number, number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (c + 1 < size) pairs.push([r, c, r, c + 1]);
        if (r + 1 < size) pairs.push([r, c, r + 1, c]);
      }
    }

    const shuffled = this.rng.shuffle(pairs);
    const count = Math.floor(shuffled.length * ratio);

    for (let i = 0; i < count; i++) {
      const [r1, c1, r2, c2] = shuffled[i];
      const v1 = solution[r1][c1];
      const v2 = solution[r2][c2];

      if (v1 === v2) continue; // shouldn't happen in a Latin square

      // Store with the smaller value first (so we always draw < pointing to the larger)
      if (v1 < v2) {
        constraints.push([r1, c1, r2, c2]);
      } else {
        constraints.push([r2, c2, r1, c1]);
      }
    }

    return constraints;
  }

  // ─── Hints ──────────────────────────────────────────────

  private generateHints(difficulty: number, size: number): string[] {
    const digits = size === 3 ? '1~3' : size === 4 ? '1~4' : '1~5';
    return [
      `每行每列填入 ${digits} 各一次。关注不等号方向，它告诉你两个格子的相对大小。`,
      `先确定最大/最小的数字位置。如果一行中某个位置比周围都大，那它很可能是 ${size}。`,
      `用排除法：如果一个数字在某行/某列只剩下一个可能的位置，直接填入。`,
    ];
  }
}
