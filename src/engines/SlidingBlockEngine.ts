/**
 * SlidingBlockEngine.ts — 华容道谜题引擎
 *
 * 采用「反向随机游走 + A* 验证」策略生成有解华容道谜题。
 * 从目标状态出发进行随机移动，保证可解性；再用 A* 搜索验证
 * 最短解步数是否落在难度对应区间内。
 */

import {
  PuzzleData,
  PuzzleType,
  PuzzleEngine,
  SlidingBlockBlock,
  SlidingBlockState,
  Direction,
} from '../models/PuzzleData';
import { SlidingBlockModel } from '../models/SlidingBlockModel';
import { SeededRandom } from '../models/SeededRandom';
import { StoryGenerator } from '../models/StoryGenerator';

// ─── 内部类型 ──────────────────────────────────────────────────

/** A* 搜索节点 */
interface AStarNode {
  model: SlidingBlockModel;
  g: number;           // 从起始到当前的步数
  h: number;           // 启发式估计（曼哈顿距离）
  f: number;           // g + h
  path: Array<{ blockId: string; direction: Direction }>;
}

/** 难度参数映射 */
interface DifficultyParams {
  reverseStepsMin: number;
  reverseStepsMax: number;
  minSteps: number;
  maxSteps: number;
}

// ─── 经典华容道方块定义 ────────────────────────────────────────

/** 经典十方块配置（横刀立马布局的方块列表，不含坐标） */
const CLASSIC_BLOCK_DEFS: Array<Omit<SlidingBlockBlock, 'x' | 'y'>> = [
  { id: 'target',      width: 2, height: 2, isTarget: true },
  { id: 'horizontal',  width: 2, height: 1, isTarget: false },
  { id: 'vertical_1',  width: 1, height: 2, isTarget: false },
  { id: 'vertical_2',  width: 1, height: 2, isTarget: false },
  { id: 'vertical_3',  width: 1, height: 2, isTarget: false },
  { id: 'vertical_4',  width: 1, height: 2, isTarget: false },
  { id: 'small_1',     width: 1, height: 1, isTarget: false },
  { id: 'small_2',     width: 1, height: 1, isTarget: false },
  { id: 'small_3',     width: 1, height: 1, isTarget: false },
  { id: 'small_4',     width: 1, height: 1, isTarget: false },
];

const BOARD_WIDTH = 4;
const BOARD_HEIGHT = 5;
const EXIT_X = 1;
const EXIT_Y = 3;
const MAX_ASTAR_NODES = 200_000;
const MAX_GENERATION_ATTEMPTS = 500;

// ─── 二叉最小堆 ──────────────────────────────────────────────

/**
 * 基于 f 值的二叉最小堆，用于 A* 搜索的优先队列。
 */
class MinHeap {
  private data: AStarNode[] = [];

  get size(): number {
    return this.data.length;
  }

  /** 插入节点 */
  push(node: AStarNode): void {
    this.data.push(node);
    this.bubbleUp(this.data.length - 1);
  }

  /** 弹出 f 值最小的节点 */
  pop(): AStarNode | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  /** 上浮操作 */
  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].f < this.data[parent].f) {
        [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
        i = parent;
      } else {
        break;
      }
    }
  }

  /** 下沉操作 */
  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.data[left].f < this.data[smallest].f) {
        smallest = left;
      }
      if (right < n && this.data[right].f < this.data[smallest].f) {
        smallest = right;
      }
      if (smallest !== i) {
        [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
        i = smallest;
      } else {
        break;
      }
    }
  }
}

// ─── 主引擎类 ─────────────────────────────────────────────────

export class SlidingBlockEngine implements PuzzleEngine {
  readonly type = PuzzleType.SLIDING_BLOCK;
  readonly isBank = false;

  private rng: SeededRandom = new SeededRandom(0);

  /**
   * 生成指定难度的华容道谜题。
   *
   * @param difficulty - 难度等级（1-10）
   * @param seed - 随机种子（可选，用于每日挑战的确定性生成）
   * @returns 标准化的 PuzzleData 对象，失败返回 null
   */
  generate(difficulty: number, seed?: number): PuzzleData | null {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);
    const params = this.getDifficultyParams(difficulty);

    for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
      // 第一步：构建目标状态
      const goalState = this.buildGoalState();
      if (!goalState) continue;

      // 第二步：反向随机游走，生成初始状态
      const reverseSteps = this.rng.nextInt(params.reverseStepsMin, params.reverseStepsMax);
      const initialModel = this.reverseWalk(goalState, reverseSteps);

      // 确保目标块已经离开出口位置（否则谜题已解）
      const targetBlock = initialModel.blocks.find(b => b.isTarget);
      if (!targetBlock || (targetBlock.x === initialModel.exitX && targetBlock.y === initialModel.exitY)) {
        continue;
      }

      // 第三步：BFS 验证最短解步数
      const solution = this.bfsSolve(initialModel);
      if (!solution) continue;

      // 验证步数是否在难度范围内
      if (solution.length < params.minSteps || solution.length > params.maxSteps) {
        continue;
      }

      // 第四步：生成提示
      const hints = this.generateHints(solution, initialModel);

      // 构造 PuzzleData
      const storyGen = new StoryGenerator(actualSeed);
      const story = storyGen.generate(
        PuzzleType.SLIDING_BLOCK,
        this.getDifficultyTitle(difficulty),
        undefined,
        `滑动方块为目标腾出道路。将目标块（2×2）移动到出口即为通关。此局最优解需要 ${solution.length} 步。`
      );

      // 添加视觉元素映射，保证和 SceneRenderer 层匹配
      const visualElements = initialModel.blocks.map(b => {
          return {
              type: b.isTarget ? 'character' : 'prop',
              id: b.id,
              position: b.id, // 直接映射逻辑 Block ID，允许解耦自定义换皮
              state: 'normal'
          };
      });

      const puzzleData: PuzzleData = {
        id: `klotski_${actualSeed}_${attempt}`,
        type: PuzzleType.SLIDING_BLOCK,
        difficulty,
        title: story.title,
        description: story.question, // description matches layout expected rule/goal text
        narrative_setup: story.scenario, // narrative_setup matches layout expected background story
        initial_state: initialModel.getState(),
        goal_state: goalState.getState(),
        hints,
        seed: actualSeed,
        visual_elements: visualElements as any, // VisualElement[]
      };

      return puzzleData;
    }

    // Return null instead of throwing — let the caller retry or skip
    return null;
  }

  // ─── 难度参数 ──────────────────────────────────────────────

  /**
   * 根据难度等级返回生成参数。
   *
   * 经典 4×5 十方块华容道的最优解理论上限约 81 步。
   * 难度映射基于实际可达的最优解步数区间。
   *
   * @param difficulty - 1-10 的难度等级
   * @returns 反向步数范围和目标解步数范围
   */
  private getDifficultyParams(difficulty: number): DifficultyParams {
    if (difficulty <= 2) {
      return { reverseStepsMin: 30, reverseStepsMax: 60, minSteps: 3, maxSteps: 12 };
    } else if (difficulty <= 4) {
      return { reverseStepsMin: 80, reverseStepsMax: 150, minSteps: 10, maxSteps: 25 };
    } else if (difficulty <= 6) {
      return { reverseStepsMin: 200, reverseStepsMax: 400, minSteps: 15, maxSteps: 35 };
    } else if (difficulty <= 8) {
      return { reverseStepsMin: 500, reverseStepsMax: 900, minSteps: 25, maxSteps: 55 };
    } else {
      return { reverseStepsMin: 800, reverseStepsMax: 1500, minSteps: 40, maxSteps: 81 };
    }
  }

  /**
   * 根据难度等级返回谜题标题。
   */
  private getDifficultyTitle(difficulty: number): string {
    if (difficulty <= 2) return '华容道 · 初出茅庐';
    if (difficulty <= 4) return '华容道 · 渐入佳境';
    if (difficulty <= 6) return '华容道 · 过关斩将';
    if (difficulty <= 8) return '华容道 · 千里走单骑';
    return '华容道 · 究极挑战';
  }

  // ─── 目标状态构建 ─────────────────────────────────────────

  /**
   * 构建目标状态：将曹操放在出口位置 (exitX, exitY)，
   * 其余方块随机放置在不重叠的合法位置。
   * 使用回溯算法尝试放置，失败则返回 null。
   *
   * @returns 目标状态的 SlidingBlockModel，或 null（放置失败）
   */
  private buildGoalState(): SlidingBlockModel | null {
    // 构建占用矩阵
    const grid: boolean[][] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      grid[y] = new Array<boolean>(BOARD_WIDTH).fill(false);
    }

    const placedBlocks: SlidingBlockBlock[] = [];

    // 首先放置目标方块（曹操）在出口位置
    const targetDef = CLASSIC_BLOCK_DEFS[0];
    const targetBlock: SlidingBlockBlock = {
      ...targetDef,
      x: EXIT_X,
      y: EXIT_Y,
    };

    // 标记曹操的占用
    for (let dy = 0; dy < targetBlock.height; dy++) {
      for (let dx = 0; dx < targetBlock.width; dx++) {
        grid[targetBlock.y + dy][targetBlock.x + dx] = true;
      }
    }
    placedBlocks.push(targetBlock);

    // 其余方块随机放置（使用回溯）
    const remainingDefs = CLASSIC_BLOCK_DEFS.slice(1);
    const shuffledDefs = this.rng.shuffle([...remainingDefs]);

    const success = this.placeBlocksBacktrack(grid, shuffledDefs, 0, placedBlocks);
    if (!success) return null;

    const state: SlidingBlockState = {
      boardWidth: BOARD_WIDTH,
      boardHeight: BOARD_HEIGHT,
      blocks: placedBlocks,
      exitX: EXIT_X,
      exitY: EXIT_Y,
    };

    return new SlidingBlockModel(state);
  }

  /**
   * 回溯法放置方块。
   *
   * @param grid - 当前占用矩阵
   * @param defs - 待放置方块定义列表
   * @param index - 当前处理的方块索引
   * @param placed - 已放置的方块列表
   * @returns 是否成功放置所有方块
   */
  private placeBlocksBacktrack(
    grid: boolean[][],
    defs: Array<Omit<SlidingBlockBlock, 'x' | 'y'>>,
    index: number,
    placed: SlidingBlockBlock[]
  ): boolean {
    if (index >= defs.length) return true;

    const def = defs[index];

    // 收集所有合法位置并随机化顺序
    const positions: Array<{ x: number; y: number }> = [];
    for (let y = 0; y <= BOARD_HEIGHT - def.height; y++) {
      for (let x = 0; x <= BOARD_WIDTH - def.width; x++) {
        if (this.canPlaceAt(grid, x, y, def.width, def.height)) {
          positions.push({ x, y });
        }
      }
    }
    this.rng.shuffle(positions);

    for (const pos of positions) {
      // 放置
      const block: SlidingBlockBlock = { ...def, x: pos.x, y: pos.y };
      this.markGrid(grid, pos.x, pos.y, def.width, def.height, true);
      placed.push(block);

      // 递归放置下一个
      if (this.placeBlocksBacktrack(grid, defs, index + 1, placed)) {
        return true;
      }

      // 回溯
      placed.pop();
      this.markGrid(grid, pos.x, pos.y, def.width, def.height, false);
    }

    return false;
  }

  /**
   * 检查是否可以在指定位置放置方块。
   */
  private canPlaceAt(
    grid: boolean[][],
    x: number, y: number,
    width: number, height: number
  ): boolean {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        if (grid[y + dy][x + dx]) return false;
      }
    }
    return true;
  }

  /**
   * 在占用矩阵中标记或清除方块位置。
   */
  private markGrid(
    grid: boolean[][],
    x: number, y: number,
    width: number, height: number,
    value: boolean
  ): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        grid[y + dy][x + dx] = value;
      }
    }
  }

  // ─── 反向随机游走 ─────────────────────────────────────────

  /**
   * 从目标状态开始进行 N 步随机合法移动，生成初始状态。
   * 避免立即撤销上一步操作，增加状态多样性。
   *
   * @param goalModel - 目标状态模型
   * @param steps - 随机游走步数
   * @returns 游走后的初始状态模型
   */
  private reverseWalk(goalModel: SlidingBlockModel, steps: number): SlidingBlockModel {
    const model = goalModel.clone();
    let lastBlockId: string | null = null;
    let lastDirection: Direction | null = null;

    for (let i = 0; i < steps; i++) {
      const allMoves = model.getAllValidMoves();

      // 过滤掉会立即撤销上一步的移动
      const filteredMoves = allMoves.filter(move => {
        if (lastBlockId === null || lastDirection === null) return true;
        return !(
          move.blockId === lastBlockId &&
          move.direction === SlidingBlockModel.oppositeDirection(lastDirection)
        );
      });

      const candidates = filteredMoves.length > 0 ? filteredMoves : allMoves;
      if (candidates.length === 0) break;

      const chosen = candidates[Math.floor(this.rng.next() * candidates.length)];
      model.moveBlock(chosen.blockId, chosen.direction);
      lastBlockId = chosen.blockId;
      lastDirection = chosen.direction;
    }

    return model;
  }

  // ─── BFS 求解器 ─────────────────────────────────────────────

  /**
   * 使用 BFS（广度优先搜索）从初始状态搜索到目标状态的最短路径。
   *
   * 经典 4×5 十方块华容道的状态空间约 65K 个可达状态，
   * BFS 可在 1 秒内穷举完毕，保证找到最优解。
   * 相比 IDA-star 和 A-star，BFS 不依赖启发式质量，更稳定。
   *
   * @param initialModel - 初始状态模型
   * @returns 解路径（移动列表），无解或超时返回 null
   */
  private bfsSolve(
    initialModel: SlidingBlockModel
  ): Array<{ blockId: string; direction: Direction }> | null {
    const startModel = initialModel.clone();

    if (startModel.checkWin()) return [];

    const startKey = startModel.serialize();
    const visited = new Set<string>([startKey]);

    // 队列元素：[模型, 路径]
    interface QueueItem {
      model: SlidingBlockModel;
      path: Array<{ blockId: string; direction: Direction }>;
    }

    const queue: QueueItem[] = [{ model: startModel, path: [] }];
    const startTime = Date.now();
    const MAX_TIME_MS = 3000;
    let nodesExplored = 0;

    while (queue.length > 0) {
      if (Date.now() - startTime > MAX_TIME_MS) return null;

      const current = queue.shift()!;
      nodesExplored++;

      const moves = current.model.getAllValidMoves();

      for (const move of moves) {
        const nextModel = current.model.clone();
        nextModel.moveBlock(move.blockId, move.direction);

        const key = nextModel.serialize();
        if (visited.has(key)) continue;
        visited.add(key);

        const newPath = [...current.path, { blockId: move.blockId, direction: move.direction }];

        if (nextModel.checkWin()) {
          return newPath;
        }

        queue.push({ model: nextModel, path: newPath });
      }
    }

    return null;
  }

  /**
   * 启发式函数：目标方块到出口的曼哈顿距离 + 路径上的障碍物惩罚。
   *
   * 纯曼哈顿距离过于乐观（admissible 但信息量低），导致 IDA* 展开
   * 大量无效节点。加入路径障碍惩罚后仍保持 admissible（每个障碍
   * 至少需要 1 步移开），但大幅缩小搜索树。
   *
   * @param model - 当前棋盘状态
   * @returns 估计的最低剩余步数
   */
  private heuristic(model: SlidingBlockModel): number {
    const target = model.blocks.find(b => b.isTarget);
    if (!target) return Infinity;

    const dx = Math.abs(target.x - model.exitX);
    const dy = Math.abs(target.y - model.exitY);
    let h = dx + dy;

    // 检查目标方块到出口路径上是否被其他方块阻挡
    // 水平路径
    const xMin = Math.min(target.x, model.exitX);
    const xMax = Math.max(target.x, model.exitX);
    for (let x = xMin; x <= xMax; x++) {
      for (let ty = target.y; ty < target.y + target.height; ty++) {
        const block = model.getBlockAt(x, ty);
        if (block && !block.isTarget) {
          h += 1;
          break;
        }
      }
    }
    // 垂直路径
    const yMin = Math.min(target.y, model.exitY);
    const yMax = Math.max(target.y, model.exitY);
    for (let y = yMin; y <= yMax; y++) {
      for (let tx = target.x; tx < target.x + target.width; tx++) {
        const block = model.getBlockAt(tx, y);
        if (block && !block.isTarget) {
          h += 1;
          break;
        }
      }
    }

    return h;
  }

  // ─── 提示生成 ──────────────────────────────────────────────

  /**
   * 根据 A* 解路径生成三条提示。
   *
   * @param solution - A* 求得的最短解路径
   * @param initialModel - 初始状态模型
   * @returns 三条中文提示字符串
   */
  private generateHints(
    solution: Array<{ blockId: string; direction: Direction }>,
    initialModel: SlidingBlockModel
  ): [string, string, string] {
    // 提示 1：第一步描述
    const firstMove = solution[0];
    const firstBlockName = this.getBlockDisplayName(firstMove.blockId);
    const firstDirName = this.getDirectionDisplayName(firstMove.direction);
    const hint1 = `第一步：尝试将「${firstBlockName}」向${firstDirName}移动。`;

    // 提示 2：关键步描述（取中间步骤）
    const keyIndex = Math.floor(solution.length / 2);
    const keyMove = solution[keyIndex];
    const keyBlockName = this.getBlockDisplayName(keyMove.blockId);
    const keyDirName = this.getDirectionDisplayName(keyMove.direction);
    const hint2 = `关键一步：在第 ${keyIndex + 1} 步时，需要将「${keyBlockName}」向${keyDirName}移动来打开通路。`;

    // 提示 3：通用策略
    const targetMoves = solution.filter(m => m.blockId === 'target').length;
    const hint3 = `整体策略：此局共需 ${solution.length} 步，其中目标块需移动 ${targetMoves} 次。优先清理下方通道。`;

    return [hint1, hint2, hint3];
  }

  /**
   * 获取方块的中文显示名称。
   */
  private getBlockDisplayName(blockId: string): string {
    const nameMap: Record<string, string> = {
      target: '主要目标(2x2)',
      horizontal: '横向障碍(2x1)',
      vertical_1: '纵向障碍1(1x2)',
      vertical_2: '纵向障碍2(1x2)',
      vertical_3: '纵向障碍3(1x2)',
      vertical_4: '纵向障碍4(1x2)',
      small_1: '小障碍1',
      small_2: '小障碍2',
      small_3: '小障碍3',
      small_4: '小障碍4',
    };
    return nameMap[blockId] ?? blockId;
  }

  /**
   * 获取方向的中文显示名称。
   */
  private getDirectionDisplayName(direction: Direction): string {
    switch (direction) {
      case Direction.UP:    return '上';
      case Direction.DOWN:  return '下';
      case Direction.LEFT:  return '左';
      case Direction.RIGHT: return '右';
    }
  }

  // ─── 工具方法 ──────────────────────────────────────────────

  /**
   * 生成 [min, max] 范围内的随机整数（含两端）。
   */
  private randomInt(min: number, max: number): number {
    return this.rng.nextInt(min, max);
  }
}
