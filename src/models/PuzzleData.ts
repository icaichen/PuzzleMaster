/**
 * PuzzleData.ts — 标准化谜题数据与引擎契约 (3-Layer Decoupled Architecture)
 *
 * Layer 1: Logic Mechanics (抽象逻辑机制)
 * Layer 2: ThemeData (主题皮肤与故事包装)
 * Layer 3: Layouts (动态交互面板) 
 */

// ─── Layer 1: 逻辑机制枚举 (11 Universal Mechanics) ──────────────

export enum PuzzleType {
  SLIDING_BLOCK = 'sliding_block',
  LOGIC_GRID = 'logic_grid',
  MATH = 'math',
  MATCHSTICK = 'matchstick',
  WEIGHING = 'weighing',
  RIVER_CROSSING = 'river_crossing',
  PATH_FINDING = 'path_finding',
  NUMBER_GRID = 'number_grid',
  JIGSAW = 'jigsaw',
  LATERAL_THINKING = 'lateral_thinking',
  WORD_PLAY = 'word_play',
  MEASUREMENT = 'measurement'
}

export const PUZZLE_TYPE_LABELS: Record<string, string> = {
  [PuzzleType.SLIDING_BLOCK]: '滑动解谜',
  [PuzzleType.LOGIC_GRID]: '逻辑网格',
  [PuzzleType.PATH_FINDING]: '一笔画'
};

export function getCategoriesForDifficulty(difficulty: number): PuzzleType[] {
  return [PuzzleType.SLIDING_BLOCK, PuzzleType.LOGIC_GRID];
}

export enum PuzzleMechanic {
  /** 空间装箱/拼接 (七巧板、拼图、塞行李箱、种树) */
  SPATIAL_ASSEMBLY = 'spatial_assembly',
  /** 滑动干涉 (华容道、停车场挪车) */
  SLIDING_BLOCK = 'sliding_block',
  /** 路径规划 (一笔画、迷宫寻宝、电路连线) */
  PATH_ROUTING = 'path_routing',
  
  /** 图论边/节点编辑 (火柴棒算式、接通水管、光线反射) */
  GRAPH_TOPOLOGY = 'graph_topology',
  /** 网格约束放置 (数独、排座位、魔法阵符文) */
  GRID_CONSTRAINT = 'grid_constraint',
  /** 矩阵交叉推理 (爱因斯坦逻辑网格、四人喝茶问题) */
  MATRIX_LOGIC = 'matrix_logic',
  
  /** 状态约束转移 (农夫过河、一家人过桥、倒水问题) */
  CONSTRAINT_TRANSFER = 'constraint_transfer',
  /** 平衡对比 (找假币问题、辨别真伪宝石) */
  WEIGHT_COMPARISON = 'weight_comparison',
  
  /** 数学序列与方程 (数列找规律、文字数学题) */
  MATH_SEQUENCE = 'math_sequence',
  /** 分组与挑选 (找不同、图形归类) */
  GROUPING_SELECTION = 'grouping_selection',
  
  /** 侧向思维/脑筋急转弯 (海龟汤、文字谜题) */
  LATERAL_RIDDLE = 'lateral_riddle',
}

/** 机制中文标签（仅供调试参考，玩家看到的是主题包装的名称） */
export const PUZZLE_MECHANIC_LABELS: Record<PuzzleMechanic, string> = {
  [PuzzleMechanic.SPATIAL_ASSEMBLY]: '⚙️ 空间装箱',
  [PuzzleMechanic.SLIDING_BLOCK]: '⚙️ 滑动干涉',
  [PuzzleMechanic.PATH_ROUTING]: '⚙️ 路径规划',
  [PuzzleMechanic.GRAPH_TOPOLOGY]: '⚙️ 图论拓扑',
  [PuzzleMechanic.GRID_CONSTRAINT]: '⚙️ 网格约束',
  [PuzzleMechanic.MATRIX_LOGIC]: '⚙️ 矩阵推理',
  [PuzzleMechanic.CONSTRAINT_TRANSFER]: '⚙️ 状态转移',
  [PuzzleMechanic.WEIGHT_COMPARISON]: '⚙️ 平衡对比',
  [PuzzleMechanic.MATH_SEQUENCE]: '⚙️ 数学序列',
  [PuzzleMechanic.GROUPING_SELECTION]: '⚙️ 逻辑分组',
  [PuzzleMechanic.LATERAL_RIDDLE]: '⚙️ 侧向思维',
};

// ─── Layer 2: 主题皮肤结构 ────────────────────────────────────────

export interface VisualElement {
  type: 'character' | 'prop' | 'background';
  id: string;      // 例如 'wolf', 'boat', 'garden_bg'
  position?: any;  // 如果皮肤包含硬编码的视觉初始坐标
  state?: any;     // 初始状态
}

export interface AssetSprite {
  id: string;          // 必须与 VisualElement 或者是逻辑实体的 ID 匹配
  url: string;         // 本地或远程 URL
  width?: number;
  height?: number;
}

export interface AssetManifest {
  background_url?: string;
  sprites: AssetSprite[];
}

/** 
 * ThemeData 包含了将抽象数学转换为具体场景的所有必要信息。
 * 它可以由人工手写配置，也可以由 AI 动态生成。
 */
export interface ThemeData {
  skin_id: string;                   // 皮肤的唯一标识 (例如 'river_wolf_sheep', 'elevator_overload')
  title: string;                     // 玩家看到的谜题标题，如 "农夫过河" 或 "超载的电梯"
  narrative_setup: string;           // 故事背景描述
  rules_description: string;         // 结合主题的规则解释 (如 "电梯不能超过 200kg")
  entity_map: Record<string, string>; // 逻辑 ID 到 显示名称 的映射 (如 "A" -> "狼", "B" -> "羊")
  assets: AssetManifest;             // 绑定的美术资源
}

// ─── 引擎接口 ───────────────────────────────────────────────

export interface PuzzleEngine {
  /** 引擎对应的基础逻辑机制 */
  readonly mechanic?: PuzzleMechanic;
  /** 是否为题库引擎 (题库引擎不会失败，PCG 引擎可能失败) */
  readonly isBank?: boolean;
  /**
   * 生成指定难度的纯抽象逻辑数据。
   * (注意：引擎不再负责生成具体文字或美术，只生成逻辑结构)
   * @param difficulty 1-10
   * @param seed 随机种子
   */
  generateLogic?(difficulty: number, seed?: number): unknown | null;
  
  // Legacy method
  generate?(difficulty: number, seed?: number): any | null;
}

// ─── 标准化最终谜题数据 (提供给 Layout 渲染) ──────────────────────

export interface PuzzleData {
  id: string;
  mechanic?: PuzzleMechanic; // optional for old
  type?: PuzzleType; // legacy
  difficulty: number;       // 1-10
  seed: number;
  
  // Layer 2: 皮肤与叙事
  theme?: ThemeData; // optional for old
  
  // Legacy properties
  title?: string;
  description?: string;
  scene_theme?: string;
  narrative_setup?: string;
  visual_elements?: any[];
  assets?: any;
  
  // Layer 1: 纯抽象数学逻辑
  initial_state: unknown;
  goal_state: unknown;
  
  // 结合了主题的提示文本
  hints: string[];
}

// ─── 原有滑块逻辑的数据结构保留（移至专门文件前暂时保留在此）────────
export interface SlidingBlockBlock {
  id: string;
  x: number;               // column (0-indexed)
  y: number;               // row    (0-indexed)
  width: number;
  height: number;
  isTarget: boolean;
}

export interface SlidingBlockState {
  boardWidth: number;
  boardHeight: number;
  blocks: SlidingBlockBlock[];
  exitX: number;
  exitY: number;
}

export enum Direction {
  UP    = 'UP',
  DOWN  = 'DOWN',
  LEFT  = 'LEFT',
  RIGHT = 'RIGHT',
}
