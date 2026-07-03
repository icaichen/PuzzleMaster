/**
 * PuzzleData.ts — 标准化谜题数据与引擎契约 (3-Layer Decoupled Architecture)
 *
 * Layer 1: Logic Mechanics (抽象逻辑机制)
 * Layer 2: ThemeData (主题皮肤与故事包装)
 * Layer 3: Layouts (动态交互面板)
 */
// ─── Layer 1: 逻辑机制枚举 (11 Universal Mechanics) ──────────────
export var PuzzleType;
(function (PuzzleType) {
    PuzzleType["SLIDING_BLOCK"] = "sliding_block";
    PuzzleType["LOGIC_GRID"] = "logic_grid";
    PuzzleType["MATH"] = "math";
    PuzzleType["MATCHSTICK"] = "matchstick";
    PuzzleType["WEIGHING"] = "weighing";
    PuzzleType["RIVER_CROSSING"] = "river_crossing";
    PuzzleType["PATH_FINDING"] = "path_finding";
    PuzzleType["NUMBER_GRID"] = "number_grid";
    PuzzleType["JIGSAW"] = "jigsaw";
    PuzzleType["LATERAL_THINKING"] = "lateral_thinking";
    PuzzleType["WORD_PLAY"] = "word_play";
    PuzzleType["MEASUREMENT"] = "measurement";
})(PuzzleType || (PuzzleType = {}));
export const PUZZLE_TYPE_LABELS = {
    [PuzzleType.SLIDING_BLOCK]: '滑动解谜',
    [PuzzleType.LOGIC_GRID]: '逻辑网格',
    [PuzzleType.PATH_FINDING]: '一笔画'
};
export function getCategoriesForDifficulty(difficulty) {
    return [PuzzleType.SLIDING_BLOCK, PuzzleType.LOGIC_GRID];
}
export var PuzzleMechanic;
(function (PuzzleMechanic) {
    /** 空间装箱/拼接 (七巧板、拼图、塞行李箱、种树) */
    PuzzleMechanic["SPATIAL_ASSEMBLY"] = "spatial_assembly";
    /** 滑动干涉 (华容道、停车场挪车) */
    PuzzleMechanic["SLIDING_BLOCK"] = "sliding_block";
    /** 路径规划 (一笔画、迷宫寻宝、电路连线) */
    PuzzleMechanic["PATH_ROUTING"] = "path_routing";
    /** 图论边/节点编辑 (火柴棒算式、接通水管、光线反射) */
    PuzzleMechanic["GRAPH_TOPOLOGY"] = "graph_topology";
    /** 网格约束放置 (数独、排座位、魔法阵符文) */
    PuzzleMechanic["GRID_CONSTRAINT"] = "grid_constraint";
    /** 矩阵交叉推理 (爱因斯坦逻辑网格、四人喝茶问题) */
    PuzzleMechanic["MATRIX_LOGIC"] = "matrix_logic";
    /** 状态约束转移 (农夫过河、一家人过桥、倒水问题) */
    PuzzleMechanic["CONSTRAINT_TRANSFER"] = "constraint_transfer";
    /** 平衡对比 (找假币问题、辨别真伪宝石) */
    PuzzleMechanic["WEIGHT_COMPARISON"] = "weight_comparison";
    /** 数学序列与方程 (数列找规律、文字数学题) */
    PuzzleMechanic["MATH_SEQUENCE"] = "math_sequence";
    /** 分组与挑选 (找不同、图形归类) */
    PuzzleMechanic["GROUPING_SELECTION"] = "grouping_selection";
    /** 侧向思维/脑筋急转弯 (海龟汤、文字谜题) */
    PuzzleMechanic["LATERAL_RIDDLE"] = "lateral_riddle";
})(PuzzleMechanic || (PuzzleMechanic = {}));
/** 机制中文标签（仅供调试参考，玩家看到的是主题包装的名称） */
export const PUZZLE_MECHANIC_LABELS = {
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
export var Direction;
(function (Direction) {
    Direction["UP"] = "UP";
    Direction["DOWN"] = "DOWN";
    Direction["LEFT"] = "LEFT";
    Direction["RIGHT"] = "RIGHT";
})(Direction || (Direction = {}));
//# sourceMappingURL=PuzzleData.js.map