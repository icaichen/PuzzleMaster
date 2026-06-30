/**
 * main.ts — 华容道应用入口
 *
 * 初始化 Canvas、控制器，并绑定 DOM 事件。
 * 管理加载状态和难度切换。
 */

import { KlotskiController } from './controllers/KlotskiController';

// ─── Difficulty labels ────────────────────────────────────────
const DIFFICULTY_LABELS: Record<string, string> = {
  '2': '简单',
  '5': '中等',
  '8': '困难',
};

/**
 * Bootstrap the Klotski game application.
 */
function main(): void {
  // ── Get DOM elements ──────────────────────────────────────
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.error('[main] Canvas element #game-canvas not found');
    return;
  }

  const difficultySelect = document.getElementById('difficulty-select') as HTMLSelectElement | null;
  const newGameBtn = document.getElementById('new-game-btn') as HTMLButtonElement | null;
  const winNextBtn = document.getElementById('win-next-btn') as HTMLButtonElement | null;
  const difficultyDisplay = document.getElementById('difficulty-display') as HTMLElement | null;
  const stepCount = document.getElementById('step-count') as HTMLElement | null;

  // ── Create controller ─────────────────────────────────────
  const controller = new KlotskiController(canvas);

  // ── Loading state helper ──────────────────────────────────
  function setLoading(loading: boolean): void {
    if (newGameBtn) {
      newGameBtn.disabled = loading;
      newGameBtn.textContent = loading ? '生成中...' : '新游戏';
    }
    if (canvas) {
      canvas.style.opacity = loading ? '0.5' : '1';
    }
  }

  /**
   * Start a new game with a brief loading state.
   */
  function startGame(difficulty: number): void {
    setLoading(true);

    // Use a short timeout to allow the UI to update before blocking generation
    setTimeout(() => {
      try {
        controller.startNewGame(difficulty);
      } catch (error) {
        console.error('[main] Error starting game:', error);
      } finally {
        setLoading(false);
      }
    }, 50);
  }

  // ── Wire event listeners ──────────────────────────────────

  // New game button
  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      const difficulty = difficultySelect ? parseInt(difficultySelect.value, 10) : 2;
      startGame(difficulty);
    });
  }

  // Win overlay "next game" button
  if (winNextBtn) {
    winNextBtn.addEventListener('click', () => {
      const difficulty = difficultySelect ? parseInt(difficultySelect.value, 10) : 2;
      startGame(difficulty);
    });
  }

  // Difficulty selector change — update display label
  if (difficultySelect) {
    difficultySelect.addEventListener('change', () => {
      if (difficultyDisplay) {
        const label = DIFFICULTY_LABELS[difficultySelect.value] || difficultySelect.value;
        difficultyDisplay.textContent = `难度: ${label}`;
      }
    });
  }

  // ── Start initial game (easy) ─────────────────────────────
  if (stepCount) {
    stepCount.textContent = '步数: 0';
  }
  if (difficultyDisplay) {
    difficultyDisplay.textContent = '难度: 简单';
  }

  startGame(2);
}

// ── Run on DOM ready ──────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
