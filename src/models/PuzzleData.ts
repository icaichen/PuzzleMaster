/**
 * PuzzleData.ts — 标准化谜题数据与引擎契约
 *
 * 所有引擎实现 PuzzleEngine 接口，通过 PuzzleRegistry 注册。
 * GameManager 只认识 Registry，不认识任何具体引擎。
 */

// ─── 谜题类别 ───────────────────────────────────────────────

export enum PuzzleType {
  /** 滑块拼图 — KlotskiEngine (PCG) */
  SLIDING_BLOCK = 'sliding_block',
  /** 逻辑网格 (爱因斯坦谜题) — LogicGridEngine (PCG) */
  LOGIC_GRID = 'logic_grid',
  /** 数学谜题 (等式/数列/魔方阵) — TemplateEngine (PCG) */
  MATH = 'math',
  /** 火柴棒谜题 — MatchstickEngine (PCG) */
  MATCHSTICK = 'matchstick',
  /** 天平称重 (N次称重找假币) — WeighingEngine (PCG) */
  WEIGHING = 'weighing',
  /** 过河问题 (狼羊菜等) — RiverCrossingEngine (PCG) */
  RIVER_CROSSING = 'river_crossing',
  /** 一笔画 / 迷宫 — PathEngine (PCG) */
  PATH_FINDING = 'path_finding',
  /** 不等号数独 / Futoshiki — NumberGridEngine (PCG) */
  NUMBER_GRID = 'number_grid',
  /** 拼图 / 七巧板 — TangramEngine (PCG) */
  JIGSAW = 'jigsaw',
  /** 测量问题 (水壶量水/沙漏计时) — MeasurementEngine (PCG) */
  MEASUREMENT = 'measurement',
  /** 侧向思维 — 题库 (curated bank) */
  LATERAL_THINKING = 'lateral_thinking',
  /** 文字游戏 — 题库 (curated bank) */
  WORD_PLAY = 'word_play',
}

/** 类别中文标签 */
export const PUZZLE_TYPE_LABELS: Record<PuzzleType, string> = {
  [PuzzleType.SLIDING_BLOCK]: '🧩 滑块拼图',
  [PuzzleType.LOGIC_GRID]: '🔍 逻辑网格',
  [PuzzleType.MATH]: '📐 数学推理',
  [PuzzleType.MATCHSTICK]: '🔥 火柴棒',
  [PuzzleType.WEIGHING]: '⚖️ 天平称重',
  [PuzzleType.RIVER_CROSSING]: '🚣 过河问题',
  [PuzzleType.PATH_FINDING]: '✏️ 一笔画',
  [PuzzleType.NUMBER_GRID]: '🔢 数字网格',
  [PuzzleType.JIGSAW]: '🧩 拼图挑战',
  [PuzzleType.MEASUREMENT]: '🫗 测量推理',
  [PuzzleType.LATERAL_THINKING]: '🧠 侧向思维',
  [PuzzleType.WORD_PLAY]: '💬 文字游戏',
};

// ─── 引擎接口 ───────────────────────────────────────────────

export interface PuzzleEngine {
  /** 引擎对应的谜题类别 */
  readonly type: PuzzleType;
  /** 是否为题库引擎 (题库引擎不会失败，PCG 引擎可能失败) */
  readonly isBank: boolean;
  /**
   * 生成指定难度的谜题。
   * @param difficulty 1-10
   * @param seed 随机种子（optional，用于确定性复现）
   * @returns PuzzleData，如果生成失败返回 null
   */
  generate(difficulty: number, seed?: number): PuzzleData | null;
}

// ─── 标准化谜题数据 ─────────────────────────────────────────

export interface PuzzleData {
  id: string;
  type: PuzzleType;
  difficulty: number;       // 1-5 (bank) or 1-10 (PCG)
  title: string;
  description: string;      // scenario / context
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
  exitX: number;
  exitY: number;
}

// ─── 方向枚举 ────────────────────────────────────────────────

export enum Direction {
  UP    = 'UP',
  DOWN  = 'DOWN',
  LEFT  = 'LEFT',
  RIGHT = 'RIGHT',
}

// ─── 帮助函数 ───────────────────────────────────────────────

/** 根据难度获取可用类别，用于旋转选择 */
export function getCategoriesForDifficulty(difficulty: number): PuzzleType[] {
  if (difficulty <= 2) {
    return [
      PuzzleType.LATERAL_THINKING, PuzzleType.WORD_PLAY,
      PuzzleType.MATH, PuzzleType.MATCHSTICK, PuzzleType.MEASUREMENT,
      PuzzleType.PATH_FINDING, PuzzleType.NUMBER_GRID,
      PuzzleType.JIGSAW,
    ];
  }
  if (difficulty <= 4) {
    return [
      PuzzleType.LATERAL_THINKING, PuzzleType.WORD_PLAY,
      PuzzleType.MATH, PuzzleType.MATCHSTICK,
      PuzzleType.WEIGHING, PuzzleType.MEASUREMENT,
      PuzzleType.RIVER_CROSSING, PuzzleType.PATH_FINDING,
      PuzzleType.NUMBER_GRID,
    ];
  }
  if (difficulty <= 6) {
    return [
      PuzzleType.LATERAL_THINKING, PuzzleType.WORD_PLAY,
      PuzzleType.MATH, PuzzleType.MATCHSTICK,
      PuzzleType.WEIGHING, PuzzleType.RIVER_CROSSING,
      PuzzleType.MEASUREMENT, PuzzleType.SLIDING_BLOCK,
      PuzzleType.LOGIC_GRID, PuzzleType.PATH_FINDING,
      PuzzleType.NUMBER_GRID,
    ];
  }
  // difficulty 7+
  return Object.values(PuzzleType);
}
