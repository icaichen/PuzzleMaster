/**
 * PuzzleData.ts — 标准化谜题数据结构
 *
 * 所有谜题引擎（华容道、CSP、模板）的输出均遵循 PuzzleData 接口。
 * Klotski 特有的类型放在同一模块中，以保持导入简洁。
 */

// ─── 谜题分类 ───────────────────────────────────────────────
export enum PuzzleType {
  SPATIAL_KLOTSKI = 'SPATIAL_KLOTSKI',
  MATH_TEMPLATE   = 'MATH_TEMPLATE',
  LOGIC_CSP       = 'LOGIC_CSP',
  LOGIC_TEXT      = 'LOGIC_TEXT', // Added for LLM generated riddles
}

// ─── 标准化谜题接口（PRD §2.1） ─────────────────────────────
export interface PuzzleData {
  id: string;
  type: PuzzleType;
  difficulty: number;       // 1-10
  title: string;
  description: string;
  initial_state: unknown;
  goal_state: unknown;
  hints: string[];
  seed: number;
}

// ─── 华容道专用类型 ──────────────────────────────────────────
export interface KlotskiBlock {
  id: string;
  x: number;               // column (0-indexed)
  y: number;               // row    (0-indexed)
  width: number;
  height: number;
  isTarget: boolean;
}

export interface KlotskiState {
  boardWidth: number;
  boardHeight: number;
  blocks: KlotskiBlock[];
  exitX: number;            // target block goal x
  exitY: number;            // target block goal y
}

// ─── 方向枚举 ────────────────────────────────────────────────
export enum Direction {
  UP    = 'UP',
  DOWN  = 'DOWN',
  LEFT  = 'LEFT',
  RIGHT = 'RIGHT',
}
