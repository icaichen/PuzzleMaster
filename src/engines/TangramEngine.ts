/**
 * TangramEngine.ts — 拼图谜题引擎 v2
 *
 * 核心改进：
 * 1. 使用精选的有辨识度形状模板替代随机 blob
 * 2. 每个形状有对应的故事名称（天鹅、圣诞树、房子等）
 * 3. 按难度分层：小形状 = 容易，大形状 = 困难
 * 4. 故事文本直接匹配形状
 */

import { PuzzleData, PuzzleType, PuzzleEngine } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
import { StoryGenerator } from '../models/StoryGenerator';

// ─── 类型 ────────────────────────────────────────────────────

export interface PieceDef {
  id: number;
  cells: [number, number][];
}

export interface PlacedPiece {
  pieceId: number;
  cells: [number, number][];
  rotation: number;
  flipped: boolean;
}

export interface TangramState {
  gridSize: number;
  targetCells: [number, number][];
  pieces: PieceDef[];
  cellCount: number;
  pieceCount: number;
  picarat: number;
  /** 形状名称，用于故事生成 */
  shapeName: string;
}

// ═══════════════════════════════════════════════════════════
//  精选形状模板 — 每个都是可辨识的图案
// ═══════════════════════════════════════════════════════════

interface ShapeTemplate {
  name: string;
  nameCN: string;
  /** 形状格点（相对于原点的坐标） */
  cells: [number, number][];
  /** 匹配的故事场景 */
  storySetup: string;
}

// 辅助：从字符串网格解析形状
function parseShape(rows: string[]): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] === 'X') cells.push([r, c]);
    }
  }
  // Normalize to origin
  const minR = Math.min(...cells.map(c => c[0]));
  const minC = Math.min(...cells.map(c => c[1]));
  return cells.map(([r, c]) => [r - minR, c - minC]);
}

const SHAPES: ShapeTemplate[] = [
  // ─── 小形状 (4-6 cells, easy) ───
  {
    name: 'heart', nameCN: '心形',
    cells: parseShape([
      '.XX.',
      'XXXX',
      'XXXX',
      '.XX.',
    ]),
    storySetup: '情人节那天，一位年轻女士留下了一封拼图情书。她说："把这些碎片拼成心的形状，就能读到我的真话。"',
  },
  {
    name: 'tree', nameCN: '圣诞树',
    cells: parseShape([
      '..X..',
      '.XXX.',
      'XXXXX',
    ]),
    storySetup: '平安夜，孩子们在壁炉旁找到一盒拼图。卡片上画着一棵圣诞树。"拼好它，圣诞老人就会来。"',
  },
  {
    name: 'arrow', nameCN: '箭头',
    cells: parseShape([
      '..X..',
      '.XXX.',
      '..X..',
      '..X..',
    ]),
    storySetup: '古老的罗盘被拆成了碎片。旅人说："谁能把箭头拼回去，就能找到通往宝藏的路。"',
  },
  {
    name: 'diamond', nameCN: '钻石',
    cells: parseShape([
      '.X.',
      'XXX',
      '.X.',
    ]),
    storySetup: '珠宝商的展示柜里，一颗钻石形状的拼图被拆散了。学徒需要在日落前重新组装。',
  },
  {
    name: 'cross', nameCN: '十字',
    cells: parseShape([
      '.X.',
      'XXX',
      '.X.',
      '.X.',
    ]),
    storySetup: '教堂的彩窗图案被打乱了。修女说："拼回十字架，阳光就会透进来。"',
  },

  // ─── 中形状 (5-8 cells, medium) ───
  {
    name: 'house', nameCN: '房子',
    cells: parseShape([
      '..X..',
      '.XXX.',
      'XXXXX',
    ]),
    storySetup: '建筑师留下了一张小屋设计图，但图纸被裁成了碎片。你能还原这座房子的轮廓吗？',
  },
  {
    name: 'star', nameCN: '星星',
    cells: parseShape([
      '..X..',
      '.XXX.',
      'XXXXX',
      '.XXX.',
      '..X..',
    ]),
    storySetup: '夜空中的北极星图案被风吹散了。天文学家需要你的帮助——把散落的星形拼回去。',
  },
  {
    name: 'fish', nameCN: '鱼',
    cells: parseShape([
      '..XX.',
      '.XXXX',
      'XXXXX',
      '.XXXX',
      '..XX.',
    ]),
    storySetup: '渔夫在码头上捡到一块木雕鱼的碎片。"这条鱼是我们村子的守护符，帮我拼回去。"',
  },
  {
    name: 'cat', nameCN: '猫',
    cells: parseShape([
      'XX..XX',
      'XXXXXX',
      'XXXXXX',
      '.XXXX.',
    ]),
    storySetup: '老奶奶的猫形木制拼图散落了一地。"咪咪最喜欢这个拼图了，你能帮帮我吗？"',
  },
  {
    name: 'butterfly', nameCN: '蝴蝶',
    cells: parseShape([
      'XX..XX',
      'XXXXXX',
      '.XXXX.',
      '..XX..',
    ]),
    storySetup: '标本馆里，一只蝴蝶标本的展示板碎成了几片。教授需要在展览开始前修复它。',
  },
  {
    name: 'boat', nameCN: '帆船',
    cells: parseShape([
      'X....',
      'XXX..',
      'XX...',
      'XXXXX',
    ]),
    storySetup: '船长掏出一张被撕碎的航海图。"这是我们的帆船图案——拼好了，咱们就起航。"',
  },

  // ─── 大形状 (9-14 cells, hard) ───
  {
    name: 'swan', nameCN: '天鹅',
    cells: parseShape([
      '.XXXX.',
      'XXXXXX',
      '..XXXX',
      '..XX..',
    ]),
    storySetup: '祖母的旧盒子里有一套七巧板。她笑着拿出一张轮廓图："用这些碎片，拼出这只天鹅。"',
  },
  {
    name: 'crown', nameCN: '王冠',
    cells: parseShape([
      'X.X.X',
      'XXXXX',
      'XXXXX',
    ]),
    storySetup: '国王的王冠徽章被调皮的小王子拆散了。宫廷工匠必须在加冕礼前把它拼好。',
  },
  {
    name: 'rocket', nameCN: '火箭',
    cells: parseShape([
      '..X..',
      '.XXX.',
      '.XXX.',
      'XXXXX',
      '..X..',
      '..X..',
    ]),
    storySetup: '小发明家的工作台上散落着火箭模型的碎片。他说："拼好它，我们就能飞向月球。"',
  },
  {
    name: 'mushroom', nameCN: '蘑菇',
    cells: parseShape([
      '.XXXX.',
      'XXXXXX',
      '..XX..',
      '..XX..',
    ]),
    storySetup: '森林里，精灵留下了一个蘑菇形状的拼图。传说拼好它的人会得到好运。',
  },
  {
    name: 'castle', nameCN: '城堡',
    cells: parseShape([
      'X.X.X',
      'XXXXX',
      'XXXXX',
      'XXXXX',
    ]),
    storySetup: '古城堡的地图上，城堡图案被分成了碎片。学者说："还原它，你就知道密道的入口。"',
  },
];

// ═══════════════════════════════════════════════════════════
//  引擎
// ═══════════════════════════════════════════════════════════

export class TangramEngine implements PuzzleEngine {
  readonly type = PuzzleType.JIGSAW;
  readonly isBank = false;

  private rng: SeededRandom = new SeededRandom(0);

  generate(difficulty: number, seed?: number): PuzzleData | null {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);

    // 按难度选形状池
    const pool = SHAPES.filter(s => {
      if (difficulty <= 2) return s.cells.length <= 6;
      if (difficulty <= 5) return s.cells.length <= 9;
      if (difficulty <= 8) return s.cells.length <= 14;
      return s.cells.length <= 20;
    });

    if (pool.length === 0) return null;

    const shape = this.rng.pick(pool);
    const targetCells = shape.cells;

    // 按难度决定碎片数和网格大小
    const pieceCount = difficulty <= 2 ? 3
      : difficulty <= 5 ? 4
      : difficulty <= 7 ? 5
      : 6;

    const maxCoord = Math.max(
      ...targetCells.map(([r, c]) => Math.max(r, c))
    );
    const gridSize = Math.max(maxCoord + 2, pieceCount + 1);

    // 分解形状为碎片
    const pieces = this.decomposeShape(targetCells, pieceCount);
    if (!pieces || pieces.length < 2) return null;

    // Normalize pieces
    const normalized: PieceDef[] = pieces.map((cells, i) => ({
      id: i,
      cells: this.normalizePiece(cells),
    }));

    // 打乱碎片顺序
    const shuffled = this.rng.shuffle(normalized);

    // 生成故事 — 使用形状专属故事
    const storyGen = new StoryGenerator(actualSeed);
    const question = `将 ${normalized.length} 个碎片拼入网格中的目标形状（${shape.nameCN}）。碎片可以旋转（R键）和翻转（F键）。`;
    const story = storyGen.generate(
      PuzzleType.JIGSAW,
      `七巧板 · ${shape.nameCN}`,
      shape.storySetup,
      question,
    );

    const picarat = difficulty * 10 + 10;

    const state: TangramState = {
      gridSize,
      targetCells,
      pieces: shuffled,
      cellCount: targetCells.length,
      pieceCount: normalized.length,
      picarat,
      shapeName: shape.nameCN,
    };

    return {
      id: `tangram_${shape.name}_${actualSeed}`,
      type: PuzzleType.JIGSAW,
      difficulty,
      title: story.title,
      description: story.scenario,
      initial_state: state,
      goal_state: { pieces: normalized },
      hints: [
        `提示一：目标形状是"${shape.nameCN}"，由 ${targetCells.length} 个格子组成，共 ${normalized.length} 个碎片。先从边角入手。`,
        `提示二：观察目标形状的轮廓——${shape.nameCN}的边缘特征很明显，试着先放置最大的碎片。`,
        `提示三：最大碎片有 ${Math.max(...normalized.map(p => p.cells.length))} 个格子。如果卡住了，尝试旋转（R键）或翻转（F键）碎片。`,
      ],
      seed: actualSeed,
    };
  }

  // ─── 分解形状 ──────────────────────────────────────────

  private decomposeShape(
    cells: [number, number][],
    pieceCount: number
  ): [number, number][][] | null {
    if (pieceCount <= 1) return [cells];
    if (cells.length < pieceCount) return null;

    const set = new Set(cells.map(([r, c]) => `${r},${c}`));
    const targetSize = Math.floor(cells.length / pieceCount);

    for (let attempt = 0; attempt < 25; attempt++) {
      const seedIdx = this.rng.nextInt(0, cells.length - 1);
      const [sr, sc] = cells[seedIdx];

      const pieceSet = new Set<string>();
      pieceSet.add(`${sr},${sc}`);
      const frontier: [number, number][] = [[sr, sc]];
      const visited = new Set<string>();
      visited.add(`${sr},${sc}`);

      while (pieceSet.size < targetSize && frontier.length > 0) {
        const idx = this.rng.nextInt(0, frontier.length - 1);
        const [r, c] = frontier[idx];
        frontier.splice(idx, 1);

        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr, nc = c + dc;
          const key = `${nr},${nc}`;
          if (set.has(key) && !visited.has(key)) {
            visited.add(key);
            frontier.push([nr, nc]);
            pieceSet.add(key);
            if (pieceSet.size >= targetSize) break;
          }
        }
      }

      if (pieceSet.size === 0) continue;

      const remainder = new Set<string>();
      for (const key of set) {
        if (!pieceSet.has(key)) remainder.add(key);
      }
      if (remainder.size === 0) continue;

      if (this.isConnected(remainder)) {
        const piece: [number, number][] = [];
        for (const key of pieceSet) {
          const [r, c] = key.split(',').map(Number);
          piece.push([r, c]);
        }
        const rem: [number, number][] = [];
        for (const key of remainder) {
          const [r, c] = key.split(',').map(Number);
          rem.push([r, c]);
        }

        const sub = this.decomposeShape(rem, pieceCount - 1);
        if (sub) {
          return [this.normalizeToOrigin(piece), ...sub];
        }
      }
    }

    // Fallback: split by row
    const sorted = [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const perPiece = Math.ceil(sorted.length / pieceCount);
    const result: [number, number][][] = [];
    for (let i = 0; i < sorted.length; i += perPiece) {
      result.push(sorted.slice(i, i + perPiece));
    }
    return result;
  }

  // ─── 辅助 ──────────────────────────────────────────────

  private isConnected(cellSet: Set<string>): boolean {
    if (cellSet.size <= 1) return true;
    const keys = [...cellSet];
    const visited = new Set<string>();
    const first = keys[0];
    visited.add(first);
    const queue = [first];
    while (queue.length > 0) {
      const key = queue.shift()!;
      const [r, c] = key.split(',').map(Number);
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nk = `${r + dr},${c + dc}`;
        if (cellSet.has(nk) && !visited.has(nk)) {
          visited.add(nk);
          queue.push(nk);
        }
      }
    }
    return visited.size === cellSet.size;
  }

  private normalizeToOrigin(cells: [number, number][]): [number, number][] {
    const minR = Math.min(...cells.map(c => c[0]));
    const minC = Math.min(...cells.map(c => c[1]));
    return cells.map(([r, c]) => [r - minR, c - minC]);
  }

  private normalizePiece(cells: [number, number][]): [number, number][] {
    return this.normalizeToOrigin(cells);
  }
}
