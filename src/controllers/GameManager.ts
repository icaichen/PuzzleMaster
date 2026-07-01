import {
  PuzzleData,
  PuzzleType,
  PUZZLE_TYPE_LABELS,
  Direction,
  KlotskiState,
} from '../models/PuzzleData';
import { PuzzleRegistry } from '../models/PuzzleRegistry';
import { KlotskiModel } from '../models/KlotskiModel';
import { KlotskiView } from '../views/KlotskiView';
import { PuzzleView } from '../views/PuzzleView';
import { TangramLayout } from '../views/layouts/TangramLayout';
import { PathFindingLayout } from '../views/layouts/PathFindingLayout';
import { NumberGridLayout } from '../views/layouts/NumberGridLayout';
import type { IPuzzleLayout } from '../views/layouts/IPuzzleLayout';

type GameMode = 'HOME' | 'STORY';

export class GameManager {
  private registry: PuzzleRegistry;
  private brainScore: number;
  private currentMode: GameMode;
  private storyPuzzlesCompleted: number;
  private currentPuzzleType: PuzzleType | null = null;

  // Klotski rendering state
  private klotskiModel: KlotskiModel | null = null;
  private klotskiView: KlotskiView | null = null;
  private klotskiSteps: number = 0;

  // Text puzzle rendering state
  private puzzleView: PuzzleView | null = null;
  /** Public for screenshot/debug: current puzzle data */
  currentPuzzle: PuzzleData | null = null;

  // Visual puzzle rendering state
  private visualLayout: TangramLayout | PathFindingLayout | NumberGridLayout | null = null;

  // Dedup: track used puzzle IDs
  private usedIds: Set<string> = new Set();

  constructor() {
    this.registry = new PuzzleRegistry();
    this.brainScore = 0;
    this.currentMode = 'HOME';
    this.storyPuzzlesCompleted = 0;

    this.bindGlobalEvents();
  }

  // ─── Global events ──────────────────────────────────────

  private bindGlobalEvents(): void {
    const storyBtn = document.getElementById('story-mode-btn');
    const homeBtn = document.getElementById('home-btn');

    if (storyBtn) storyBtn.addEventListener('click', () => this.startStoryMode());
    if (homeBtn) homeBtn.addEventListener('click', () => this.goHome());
  }

  // ─── Mode transitions ───────────────────────────────────

  goHome(): void {
    this.currentMode = 'HOME';
    this.showScreen('home-screen');
    this.updateScoreDisplay();
  }

  startStoryMode(): void {
    this.currentMode = 'STORY';
    this.storyPuzzlesCompleted = 0;
    this.usedIds.clear();
    this.showScreen('game-container');
    this.loadNextPuzzle();
  }

  // ─── Puzzle loading ─────────────────────────────────────

  /** Public for navigation */
  loadNextPuzzle(): void {
    const difficulty = this.getDifficulty();

    // Try up to 20 times to get a non-duplicate puzzle
    for (let attempt = 0; attempt < 20; attempt++) {
      const puzzle = this.registry.generateRandom(difficulty);
      if (!puzzle) continue;
      if (this.usedIds.has(puzzle.id)) continue;

      this.usedIds.add(puzzle.id);
      this.currentPuzzle = puzzle;
      this.currentPuzzleType = puzzle.type;
      this.loadPuzzle(puzzle);
      return;
    }

    // All combinations exhausted — show completion
    this.showWinOverlay(
      '🎉 全部通关！',
      'Brain Score: ' + this.brainScore,
      '回到首页',
      () => this.goHome()
    );
  }

  private getDifficulty(): number {
    // Gradual ramp: first 5 easy, then harder
    if (this.storyPuzzlesCompleted < 5) return 2;
    if (this.storyPuzzlesCompleted < 15) return 4;
    if (this.storyPuzzlesCompleted < 30) return 6;
    if (this.storyPuzzlesCompleted < 50) return 8;
    return 10;
  }

  private loadPuzzle(puzzleData: PuzzleData): void {
    const container = document.getElementById('game-container');
    if (!container) return;

    container.innerHTML = '';
    this.klotskiModel = null;
    this.klotskiView = null;
    this.puzzleView = null;
    this.visualLayout?.destroy();
    this.visualLayout = null;
    this.klotskiSteps = 0;

    // Dispatch to appropriate view
    if (puzzleData.type === PuzzleType.SLIDING_BLOCK) {
      this.loadKlotskiPuzzle(container, puzzleData);
    } else if (puzzleData.type === PuzzleType.PATH_FINDING || puzzleData.type === PuzzleType.NUMBER_GRID || puzzleData.type === PuzzleType.JIGSAW) {
      this.loadVisualPuzzle(container, puzzleData);
    } else {
      this.loadTextPuzzle(container, puzzleData);
    }

    this.updateProgressDisplay();
  }

  // ─── Sliding block (canvas) ─────────────────────────────

  private loadKlotskiPuzzle(container: HTMLElement, puzzleData: PuzzleData): void {
    const canvas = document.createElement('canvas');
    canvas.id = 'game-canvas';
    container.appendChild(canvas);

    const initialState = puzzleData.initial_state as KlotskiState;
    this.klotskiModel = new KlotskiModel(initialState);
    this.klotskiView = new KlotskiView(canvas, this.klotskiModel);

    this.klotskiView.onBlockMove = (blockId: string, direction: Direction) => {
      this.handleKlotskiMove(blockId, direction);
    };

    this.updateStepDisplay(true);
  }

  private handleKlotskiMove(blockId: string, direction: Direction): void {
    if (!this.klotskiModel || !this.klotskiView) return;

    const block = this.klotskiModel.getBlockById(blockId);
    if (!block) return;
    const prevX = block.x;
    const prevY = block.y;

    const moved = this.klotskiModel.moveBlock(blockId, direction);
    if (!moved) return;

    this.klotskiSteps++;
    this.updateStepDisplay(true);
    this.klotskiView.animateMove(blockId, prevX, prevY, block.x, block.y);

    if (this.klotskiModel.checkWin()) {
      this.handleKlotskiWin();
    }
  }

  private handleKlotskiWin(): void {
    if (this.klotskiView) this.klotskiView.showWin();
    this.brainScore += 10;
    this.storyPuzzlesCompleted++;
    this.handlePuzzleSolved();
  }

  // ─── Visual puzzle (Canvas) ─────────────────────────────

  private loadVisualPuzzle(container: HTMLElement, puzzleData: PuzzleData): void {
    const state = puzzleData.initial_state as any;
    const picarat = state.picarat ?? this.difficultyToPicarat(puzzleData.difficulty);

    // 根据类型选择 Layout
    let layout: IPuzzleLayout;
    if (puzzleData.type === PuzzleType.PATH_FINDING) {
      layout = new PathFindingLayout();
    } else if (puzzleData.type === PuzzleType.NUMBER_GRID) {
      layout = new NumberGridLayout();
    } else {
      layout = new TangramLayout();
    }

    layout.setCallbacks({
      onWin: () => {
        if (this.currentMode === 'STORY') {
          this.storyPuzzlesCompleted++;
          this.handlePuzzleSolved();
        }
      },
      onNext: () => {
        if (this.currentMode === 'STORY') {
          this.loadNextPuzzle();
        } else {
          this.goHome();
        }
      },
    });

    layout.mount(container);
    (layout as any).render({ puzzle: puzzleData, picarat });
    this.visualLayout = layout as any;
    this.updateStepDisplay(false);
  }

  // ─── Text puzzle ────────────────────────────────────────

  private loadTextPuzzle(container: HTMLElement, puzzleData: PuzzleData): void {
    const state = puzzleData.initial_state as any;

    this.puzzleView = new PuzzleView(container);
    this.puzzleView.setPuzzle({
      title: puzzleData.title,
      scenario: puzzleData.description,
      question: state.question ?? puzzleData.description,
      answer: (puzzleData.goal_state as any).answer ?? '',
      hints: puzzleData.hints,
      picarat: state.picarat ?? this.difficultyToPicarat(puzzleData.difficulty),
      category: PUZZLE_TYPE_LABELS[puzzleData.type] || state.category || 'unknown',
    });

    this.puzzleView.onWin(() => {
      if (this.currentMode === 'STORY') {
        this.storyPuzzlesCompleted++;
        this.handlePuzzleSolved();
      }
    });

    this.puzzleView.onNext(() => {
      if (this.currentMode === 'STORY') {
        this.loadNextPuzzle();
      } else {
        this.goHome();
      }
    });

    this.puzzleView.render();
    this.updateStepDisplay(false);
  }

  // ─── Shared puzzle-solved handling ──────────────────────

  private handlePuzzleSolved(): void {
    const puzzle = this.currentPuzzle;
    const picarat = (puzzle?.initial_state as any)?.picarat
      ?? this.difficultyToPicarat(puzzle?.difficulty ?? 5);

    const gain = Math.ceil(picarat / 5);
    this.brainScore += gain;

    this.updateProgressDisplay();

    const typeLabel = puzzle
      ? PUZZLE_TYPE_LABELS[puzzle.type] || ''
      : '';

    this.showWinOverlay(
      '✦ 解谜成功！',
      `第 ${this.storyPuzzlesCompleted} 题 · ${typeLabel} · +${gain} Brain Score`,
      '下一题',
      () => this.loadNextPuzzle()
    );
  }

  // ─── UI helpers ─────────────────────────────────────────

  private showScreen(id: string): void {
    const home = document.getElementById('home-screen');
    const game = document.getElementById('game-container');
    const homeBtn = document.getElementById('home-btn');
    const progressEl = document.getElementById('story-progress');

    if (home) home.style.display = id === 'home-screen' ? 'flex' : 'none';
    if (game) game.style.display = id === 'game-container' ? 'flex' : 'none';
    if (homeBtn) homeBtn.style.display = id === 'home-screen' ? 'none' : 'block';
    if (progressEl) progressEl.style.display = id === 'game-container' && this.currentMode === 'STORY' ? 'block' : 'none';

    this.updateScoreDisplay();
  }

  private showWinOverlay(title: string, message: string, btnText: string, onAction: () => void): void {
    const overlay = document.getElementById('win-overlay');
    const winTitle = document.getElementById('win-title');
    const winMsg = document.getElementById('win-message');
    const winBtn = document.getElementById('win-next-btn');

    if (winTitle) winTitle.textContent = title;
    if (winMsg) winMsg.textContent = message;
    if (winBtn) winBtn.textContent = btnText;

    if (overlay) {
      overlay.classList.add('visible');
      const newBtn = winBtn?.cloneNode(true) as HTMLElement;
      if (winBtn && newBtn) {
        winBtn.replaceWith(newBtn);
        newBtn.addEventListener('click', () => {
          overlay.classList.remove('visible');
          onAction();
        });
      }
    }
  }

  private updateStepDisplay(show: boolean): void {
    const el = document.getElementById('step-count');
    if (!el) return;
    if (show) {
      el.style.display = 'block';
      el.textContent = '步数: ' + this.klotskiSteps;
    } else {
      el.style.display = 'none';
    }
  }

  private updateProgressDisplay(): void {
    const progressEl = document.getElementById('story-progress');
    if (progressEl) {
      const typeLabel = this.currentPuzzleType
        ? ' · ' + PUZZLE_TYPE_LABELS[this.currentPuzzleType]
        : '';
      progressEl.textContent = `第 ${this.storyPuzzlesCompleted + 1} 题${typeLabel}`;
      progressEl.style.display = 'block';
    }
    const scoreEl = document.getElementById('score-display');
    if (scoreEl) scoreEl.textContent = String(this.brainScore);
  }

  private updateScoreDisplay(): void {
    const el = document.getElementById('score-display');
    if (el) el.textContent = String(this.brainScore);
  }

  private difficultyToPicarat(difficulty: number): number {
    return difficulty * 10 + 10;
  }
}
