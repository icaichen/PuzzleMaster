/**
 * KlotskiController.ts — 华容道游戏控制器
 *
 * 协调 Model、View 和 Engine 之间的交互。
 * 管理游戏流程：新游戏 → 游戏中 → 胜利 → 下一局。
 */

import { Direction, PuzzleData, KlotskiState } from '../models/PuzzleData';
import { KlotskiModel } from '../models/KlotskiModel';
import { KlotskiView } from '../views/KlotskiView';
import { KlotskiEngine } from '../engines/KlotskiEngine';

/**
 * KlotskiController — orchestrates game lifecycle.
 *
 * Owns the Model, View, and Engine instances. Wires user interactions
 * from the View into Model mutations and detects the win condition.
 */
export class KlotskiController {
  private model: KlotskiModel;
  private view: KlotskiView;
  private engine: KlotskiEngine;
  private steps: number;
  private isGameOver: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new KlotskiEngine();
    this.steps = 0;
    this.isGameOver = false;

    // Bootstrap with a default empty 4×5 board until startNewGame is called
    const defaultState: KlotskiState = {
      boardWidth: 4,
      boardHeight: 5,
      blocks: [],
      exitX: 1,
      exitY: 3,
    };
    this.model = new KlotskiModel(defaultState);
    this.view = new KlotskiView(canvas, this.model);

    // Wire up the view's move callback
    this.view.onBlockMove = (blockId: string, direction: Direction) => {
      this.handleMove(blockId, direction);
    };
  }

  /**
   * Start a new game with the given difficulty level.
   * @param difficulty — puzzle difficulty (1–10). Passed to the engine.
   */
  startNewGame(difficulty: number): void {
    try {
      const puzzle: PuzzleData = this.engine.generatePuzzle(difficulty);
      const initialState = puzzle.initial_state as KlotskiState;

      this.model = new KlotskiModel(initialState);
      this.view.setModel(this.model);

      // Re-wire the callback (setModel resets internal state)
      this.view.onBlockMove = (blockId: string, direction: Direction) => {
        this.handleMove(blockId, direction);
      };

      this.steps = 0;
      this.isGameOver = false;

      this.updateUI();
      this.view.render();

      // Hide win overlay if visible
      const overlay = document.getElementById('win-overlay');
      if (overlay) {
        overlay.classList.remove('visible');
      }
    } catch (error) {
      console.error('[KlotskiController] Failed to generate puzzle:', error);
    }
  }

  /**
   * Handle a block move request from the view.
   */
  private handleMove(blockId: string, direction: Direction): void {
    if (this.isGameOver) return;

    // Capture pre-move position for animation
    const block = this.model.getBlockById(blockId);
    if (!block) return;
    const prevX = block.x;
    const prevY = block.y;

    const moved = this.model.moveBlock(blockId, direction);
    if (!moved) return;

    this.steps++;
    this.updateUI();

    // Animate the move
    this.view.animateMove(blockId, prevX, prevY, block.x, block.y);

    // Check win condition
    if (this.model.checkWin()) {
      this.onWin();
    }
  }

  /**
   * Handle win state.
   */
  private onWin(): void {
    this.isGameOver = true;
    this.view.showWin();

    // Show overlay
    const overlay = document.getElementById('win-overlay');
    if (overlay) {
      overlay.classList.add('visible');
    }

    // Update win message
    const winMessage = document.getElementById('win-message');
    if (winMessage) {
      winMessage.textContent = `用了 ${this.steps} 步完成`;
    }
  }

  /**
   * Update DOM UI elements with current game state.
   */
  private updateUI(): void {
    const stepCount = document.getElementById('step-count');
    if (stepCount) {
      stepCount.textContent = `步数: ${this.steps}`;
    }
  }
}
