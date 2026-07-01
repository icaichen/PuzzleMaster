/**
 * PathEngine.ts — 一笔画 / 路径谜题生成器
 *
 * 生成 N×N 网格上的哈密顿路径谜题。
 * 玩家需要画一条线访问所有节点各一次。
 * 部分边已给出提示，玩家补充其余。
 */

import { PuzzleType, PuzzleData, PuzzleEngine } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
import { StoryGenerator } from '../models/StoryGenerator';

export interface PathPuzzleState {
  gridSize: number;
  /** Solution: ordered node indices (0 to gridSize²-1) */
  solutionPath: number[];
  /** Edges shown to player: [fromIdx, toIdx] */
  givenEdges: [number, number][];
  /** Where the path starts */
  startNode: number;
  /** Where the path ends */
  endNode: number;
}

export class PathEngine implements PuzzleEngine {
  readonly type = PuzzleType.PATH_FINDING;
  readonly isBank = false;
  private rng = new SeededRandom(0);

  generate(difficulty: number, seed?: number): PuzzleData | null {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);

    const gridSize = this.gridSizeForDifficulty(difficulty);
    const solutionPath = this.findHamiltonianPath(gridSize);
    if (!solutionPath) return null;

    const givenRatio = this.givenRatioForDifficulty(difficulty);
    const givenEdges = this.selectGivenEdges(solutionPath, givenRatio);

    const state: PathPuzzleState = {
      gridSize,
      solutionPath,
      givenEdges,
      startNode: solutionPath[0],
      endNode: solutionPath[solutionPath.length - 1],
    };

    const storyGen = new StoryGenerator(actualSeed);
    const story = storyGen.generate(
      PuzzleType.PATH_FINDING,
      '一笔画路径',
      undefined,
      `在 ${gridSize}×${gridSize} 的点阵中画一条连续线，访问所有点各一次。起点(S)和终点(E)已标记。`
    );

    return {
      id: `path_${gridSize}_${actualSeed}`,
      type: PuzzleType.PATH_FINDING,
      difficulty,
      title: story.title,
      description: story.scenario,
      initial_state: state,
      goal_state: { path: solutionPath },
      hints: this.generateHints(difficulty, gridSize),
      seed: actualSeed,
    };
  }

  // ─── Difficulty mapping ─────────────────────────────────

  private gridSizeForDifficulty(d: number): number {
    if (d <= 2) return 4;   // 16 nodes
    if (d <= 5) return 5;   // 25 nodes
    if (d <= 8) return 6;   // 36 nodes
    return 7;                // 49 nodes
  }

  private givenRatioForDifficulty(d: number): number {
    if (d <= 2) return 0.45;
    if (d <= 5) return 0.3;
    if (d <= 8) return 0.2;
    return 0.1;
  }

  // ─── Hamiltonian path via DFS ───────────────────────────

  private findHamiltonianPath(n: number): number[] | null {
    const total = n * n;
    const adjacency = this.buildGridAdjacency(n);

    // Try random start nodes up to 20 times
    for (let attempt = 0; attempt < 20; attempt++) {
      const start = Math.floor(this.rng.next() * total);
      const path = this.dfsHamiltonian(start, total, adjacency);
      if (path) return path;
    }
    return null;
  }

  private buildGridAdjacency(n: number): number[][] {
    const total = n * n;
    const adj: number[][] = Array.from({ length: total }, () => []);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const idx = r * n + c;
        if (c + 1 < n) { adj[idx].push(r * n + (c + 1)); adj[r * n + (c + 1)].push(idx); }
        if (r + 1 < n) { adj[idx].push((r + 1) * n + c); adj[(r + 1) * n + c].push(idx); }
      }
    }
    // Shuffle each adjacency list for randomness
    for (let i = 0; i < total; i++) {
      adj[i] = this.rng.shuffle(adj[i]);
    }
    return adj;
  }

  private dfsHamiltonian(
    current: number,
    total: number,
    adjacency: number[][],
    visited: boolean[] = Array(total).fill(false),
    path: number[] = [],
  ): number[] | null {
    visited[current] = true;
    path.push(current);

    if (path.length === total) return [...path];

    for (const neighbor of adjacency[current]) {
      if (!visited[neighbor]) {
        const result = this.dfsHamiltonian(neighbor, total, adjacency, visited, path);
        if (result) return result;
      }
    }

    path.pop();
    visited[current] = false;
    return null;
  }

  // ─── Given edge selection ───────────────────────────────

  private selectGivenEdges(solutionPath: number[], ratio: number): [number, number][] {
    const edges: [number, number][] = [];
    for (let i = 0; i < solutionPath.length - 1; i++) {
      edges.push([solutionPath[i], solutionPath[i + 1]]);
    }

    // Always show start and end nodes (first and last edges)
    const keepCount = Math.max(2, Math.ceil(edges.length * ratio));
    const keepIndices = new Set<number>();

    // Always keep first and last edge
    keepIndices.add(0);
    keepIndices.add(edges.length - 1);

    // Randomly select remaining edges
    const candidates = [];
    for (let i = 1; i < edges.length - 1; i++) candidates.push(i);
    const shuffled = this.rng.shuffle(candidates);

    let picked = 2;
    for (const idx of shuffled) {
      if (picked >= keepCount) break;
      keepIndices.add(idx);
      picked++;
    }

    return edges.filter((_, i) => keepIndices.has(i));
  }

  // ─── Hints ──────────────────────────────────────────────

  private generateHints(difficulty: number, gridSize: number): string[] {
    const total = gridSize * gridSize;
    return [
      `从起点出发，每次移动到相邻的（上下左右）点。一共需要访问 ${total} 个点。`,
      `已经画出的线段是正确路径的一部分。从已有的线段出发，逐步扩展到相邻的未访问点。`,
      `尝试从两端（起点和终点）同时向中间推进。如果某一步走进死胡同，检查是否有其他分支可以走。`,
    ];
  }
}
