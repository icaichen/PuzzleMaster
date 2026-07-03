/**
 * SlidingBlockModel.ts — 华容道数据模型
 *
 * 维护棋盘状态、碰撞检测占用矩阵，以及方块移动逻辑。
 * 设计为纯数据层，不包含任何渲染或输入处理逻辑。
 */

import { SlidingBlockBlock, SlidingBlockState, Direction } from './PuzzleData';

export class SlidingBlockModel {
  boardWidth: number;
  boardHeight: number;
  blocks: SlidingBlockBlock[];
  exitX: number;
  exitY: number;

  /** occupancy[row][col] → blockId or null */
  private occupancy: (string | null)[][];

  constructor(state: SlidingBlockState) {
    this.boardWidth = state.boardWidth;
    this.boardHeight = state.boardHeight;
    this.blocks = state.blocks.map(b => ({ ...b }));
    this.exitX = state.exitX;
    this.exitY = state.exitY;
    this.occupancy = this.buildOccupancy();
  }

  // ─── Occupancy helpers ─────────────────────────────────────

  private buildOccupancy(): (string | null)[][] {
    const grid: (string | null)[][] = [];
    for (let y = 0; y < this.boardHeight; y++) {
      grid[y] = new Array<string | null>(this.boardWidth).fill(null);
    }
    for (const block of this.blocks) {
      for (let dy = 0; dy < block.height; dy++) {
        for (let dx = 0; dx < block.width; dx++) {
          grid[block.y + dy][block.x + dx] = block.id;
        }
      }
    }
    return grid;
  }

  // ─── Block queries ──────────────────────────────────────────

  getBlockById(id: string): SlidingBlockBlock | undefined {
    return this.blocks.find(b => b.id === id);
  }

  getBlockAt(x: number, y: number): SlidingBlockBlock | null {
    if (x < 0 || x >= this.boardWidth || y < 0 || y >= this.boardHeight) {
      return null;
    }
    const id = this.occupancy[y][x];
    return id ? (this.getBlockById(id) ?? null) : null;
  }

  // ─── Move logic ─────────────────────────────────────────────

  canMove(blockId: string, direction: Direction): boolean {
    const block = this.getBlockById(blockId);
    if (!block) return false;

    const { dx, dy } = SlidingBlockModel.directionDelta(direction);
    const newX = block.x + dx;
    const newY = block.y + dy;

    // Bounds check
    if (newX < 0 || newX + block.width > this.boardWidth) return false;
    if (newY < 0 || newY + block.height > this.boardHeight) return false;

    // Collision check — only inspect cells the block would newly occupy
    for (let by = 0; by < block.height; by++) {
      for (let bx = 0; bx < block.width; bx++) {
        const cx = newX + bx;
        const cy = newY + by;
        const occupant = this.occupancy[cy][cx];
        if (occupant !== null && occupant !== blockId) {
          return false;
        }
      }
    }
    return true;
  }

  moveBlock(blockId: string, direction: Direction): boolean {
    if (!this.canMove(blockId, direction)) return false;

    const block = this.getBlockById(blockId)!;
    const { dx, dy } = SlidingBlockModel.directionDelta(direction);

    // Clear old footprint
    for (let by = 0; by < block.height; by++) {
      for (let bx = 0; bx < block.width; bx++) {
        this.occupancy[block.y + by][block.x + bx] = null;
      }
    }

    // Update position
    block.x += dx;
    block.y += dy;

    // Stamp new footprint
    for (let by = 0; by < block.height; by++) {
      for (let bx = 0; bx < block.width; bx++) {
        this.occupancy[block.y + by][block.x + bx] = blockId;
      }
    }
    return true;
  }

  // ─── Win condition ──────────────────────────────────────────

  checkWin(): boolean {
    const target = this.blocks.find(b => b.isTarget);
    if (!target) return false;
    return target.x === this.exitX && target.y === this.exitY;
  }

  // ─── Serialization ──────────────────────────────────────────

  getState(): SlidingBlockState {
    return {
      boardWidth: this.boardWidth,
      boardHeight: this.boardHeight,
      blocks: this.blocks.map(b => ({ ...b })),
      exitX: this.exitX,
      exitY: this.exitY,
    };
  }

  setState(state: SlidingBlockState): void {
    this.boardWidth = state.boardWidth;
    this.boardHeight = state.boardHeight;
    this.blocks = state.blocks.map(b => ({ ...b }));
    this.exitX = state.exitX;
    this.exitY = state.exitY;
    this.occupancy = this.buildOccupancy();
  }

  clone(): SlidingBlockModel {
    return new SlidingBlockModel(this.getState());
  }

  /**
   * Canonical string for state-space deduplication.
   * Blocks of the same shape (and non-target) are interchangeable,
   * so we group by (width×height), sort positions within each group,
   * and concatenate. This dramatically shrinks the visited set.
   */
  serialize(): string {
    const groups = new Map<string, string[]>();
    for (const b of this.blocks) {
      const key = `${b.width}x${b.height}${b.isTarget ? 'T' : ''}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(`${b.x},${b.y}`);
    }
    const parts: string[] = [];
    for (const key of [...groups.keys()].sort()) {
      const positions = groups.get(key)!.sort();
      parts.push(`${key}:${positions.join(';')}`);
    }
    return parts.join('|');
  }

  // ─── Enumeration ────────────────────────────────────────────

  getAllValidMoves(): Array<{ blockId: string; direction: Direction }> {
    const moves: Array<{ blockId: string; direction: Direction }> = [];
    const directions = [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
    for (const block of this.blocks) {
      for (const dir of directions) {
        if (this.canMove(block.id, dir)) {
          moves.push({ blockId: block.id, direction: dir });
        }
      }
    }
    return moves;
  }

  // ─── Utility ────────────────────────────────────────────────

  static directionDelta(direction: Direction): { dx: number; dy: number } {
    switch (direction) {
      case Direction.UP:    return { dx: 0, dy: -1 };
      case Direction.DOWN:  return { dx: 0, dy: 1 };
      case Direction.LEFT:  return { dx: -1, dy: 0 };
      case Direction.RIGHT: return { dx: 1, dy: 0 };
    }
  }

  static oppositeDirection(direction: Direction): Direction {
    switch (direction) {
      case Direction.UP:    return Direction.DOWN;
      case Direction.DOWN:  return Direction.UP;
      case Direction.LEFT:  return Direction.RIGHT;
      case Direction.RIGHT: return Direction.LEFT;
    }
  }
}
