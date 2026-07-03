import { PuzzleType, PUZZLE_TYPE_LABELS, } from '../models/PuzzleData';
import { PuzzleRegistry } from '../models/PuzzleRegistry';
import { PuzzleView } from '../views/PuzzleView';
import { TangramLayout } from '../views/layouts/TangramLayout';
import { PathFindingLayout } from '../views/layouts/PathFindingLayout';
import { NumberGridLayout } from '../views/layouts/NumberGridLayout';
import { SlidingBlockLayout } from '../views/layouts/SlidingBlockLayout';
import { ConstraintTransferLayout } from '../views/layouts/ConstraintTransferLayout';
import { PuzzleGeneratorService } from '../services/PuzzleGeneratorService';
import { PuzzleMechanic } from '../models/PuzzleData';
export class GameManager {
    constructor() {
        this.currentPuzzleType = null;
        // Text puzzle rendering state
        this.puzzleView = null;
        /** Public for screenshot/debug: current puzzle data */
        this.currentPuzzle = null;
        // Visual puzzle rendering state
        this.visualLayout = null;
        // Dedup: track used puzzle IDs
        // Dedup: track used puzzle IDs
        this.usedIds = new Set();
        this.registry = new PuzzleRegistry();
        this.puzzleGenService = new PuzzleGeneratorService();
        this.brainScore = 0;
        this.currentMode = 'HOME';
        this.storyPuzzlesCompleted = 0;
        this.bindGlobalEvents();
    }
    // ─── Global events ──────────────────────────────────────
    bindGlobalEvents() {
        const storyBtn = document.getElementById('story-mode-btn');
        const homeBtn = document.getElementById('home-btn');
        if (storyBtn)
            storyBtn.addEventListener('click', () => this.startStoryMode());
        if (homeBtn)
            homeBtn.addEventListener('click', () => this.goHome());
    }
    // ─── Mode transitions ───────────────────────────────────
    goHome() {
        this.currentMode = 'HOME';
        this.showScreen('home-screen');
        this.updateScoreDisplay();
    }
    startStoryMode() {
        this.currentMode = 'STORY';
        this.storyPuzzlesCompleted = 0;
        this.usedIds.clear();
        this.showScreen('game-container');
        this.loadNextPuzzle();
    }
    async startHybridDemo() {
        this.currentMode = 'STORY';
        this.showScreen('game-container');
        const container = document.getElementById('game-container');
        if (!container)
            return;
        container.innerHTML = '<div style="padding:40px; text-align:center; color:white;">🤖 AI 正在为您生成独特的《雷顿教授》风格剧本，请稍候...</div>';
        try {
            const puzzle = await this.puzzleGenService.generatePuzzle(PuzzleMechanic.CONSTRAINT_TRANSFER, 4);
            if (puzzle) {
                this.currentPuzzle = puzzle;
                container.innerHTML = ''; // clear loading
                this.visualLayout?.destroy();
                const layout = new ConstraintTransferLayout();
                layout.setCallbacks({
                    onWin: () => {
                        this.showWinOverlay('✦ 解谜成功！', 'AI 动态生成的逻辑非常严密！', '回到首页', () => this.goHome());
                    },
                    onNext: () => this.goHome()
                });
                layout.mount(container);
                layout.render({ puzzle, picarat: 50 });
                this.visualLayout = layout;
            }
        }
        catch (e) {
            console.error(e);
            container.innerHTML = '<div style="padding:40px; text-align:center; color:red;">生成失败，请检查控制台。</div>';
        }
    }
    // ─── Puzzle loading ─────────────────────────────────────
    /** Public for navigation */
    loadNextPuzzle() {
        const difficulty = this.getDifficulty();
        // Try up to 20 times to get a non-duplicate puzzle
        for (let attempt = 0; attempt < 20; attempt++) {
            const puzzle = this.registry.generateRandom(difficulty);
            if (!puzzle)
                continue;
            if (this.usedIds.has(puzzle.id))
                continue;
            this.usedIds.add(puzzle.id);
            this.currentPuzzle = puzzle;
            this.currentPuzzleType = puzzle.type;
            this.loadPuzzle(puzzle);
            return;
        }
        // All combinations exhausted — show completion
        this.showWinOverlay('🎉 全部通关！', 'Brain Score: ' + this.brainScore, '回到首页', () => this.goHome());
    }
    getDifficulty() {
        // Gradual ramp: first 5 easy, then harder
        if (this.storyPuzzlesCompleted < 5)
            return 2;
        if (this.storyPuzzlesCompleted < 15)
            return 4;
        if (this.storyPuzzlesCompleted < 30)
            return 6;
        if (this.storyPuzzlesCompleted < 50)
            return 8;
        return 10;
    }
    loadPuzzle(puzzleData) {
        const container = document.getElementById('game-container');
        if (!container)
            return;
        container.innerHTML = '';
        this.puzzleView = null;
        this.visualLayout?.destroy();
        this.visualLayout = null;
        // Dispatch to appropriate view
        if (puzzleData.type === PuzzleType.SLIDING_BLOCK ||
            puzzleData.type === PuzzleType.PATH_FINDING ||
            puzzleData.type === PuzzleType.NUMBER_GRID ||
            puzzleData.type === PuzzleType.JIGSAW) {
            this.loadVisualPuzzle(container, puzzleData);
        }
        else {
            this.loadTextPuzzle(container, puzzleData);
        }
        this.updateProgressDisplay();
    }
    // ─── Visual puzzle (Canvas) ─────────────────────────────
    loadVisualPuzzle(container, puzzleData) {
        const state = puzzleData.initial_state;
        const picarat = state.picarat ?? this.difficultyToPicarat(puzzleData.difficulty);
        // 根据类型选择 Layout
        let layout;
        if (puzzleData.type === PuzzleType.PATH_FINDING) {
            layout = new PathFindingLayout();
        }
        else if (puzzleData.type === PuzzleType.NUMBER_GRID) {
            layout = new NumberGridLayout();
        }
        else if (puzzleData.type === PuzzleType.SLIDING_BLOCK) {
            layout = new SlidingBlockLayout();
        }
        else {
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
                }
                else {
                    this.goHome();
                }
            },
        });
        layout.mount(container);
        layout.render({ puzzle: puzzleData, picarat });
        this.visualLayout = layout;
    }
    // ─── Text puzzle ────────────────────────────────────────
    loadTextPuzzle(container, puzzleData) {
        const state = puzzleData.initial_state;
        this.puzzleView = new PuzzleView(container);
        this.puzzleView.setPuzzle({
            title: puzzleData.title,
            scenario: puzzleData.description,
            question: state.question ?? puzzleData.description,
            answer: puzzleData.goal_state.answer ?? '',
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
            }
            else {
                this.goHome();
            }
        });
        this.puzzleView.render();
    }
    // ─── Shared puzzle-solved handling ──────────────────────
    handlePuzzleSolved() {
        const puzzle = this.currentPuzzle;
        const picarat = puzzle?.initial_state?.picarat
            ?? this.difficultyToPicarat(puzzle?.difficulty ?? 5);
        const gain = Math.ceil(picarat / 5);
        this.brainScore += gain;
        this.updateProgressDisplay();
        const typeLabel = puzzle
            ? PUZZLE_TYPE_LABELS[puzzle.type] || ''
            : '';
        this.showWinOverlay('✦ 解谜成功！', `第 ${this.storyPuzzlesCompleted} 题 · ${typeLabel} · +${gain} Brain Score`, '下一题', () => this.loadNextPuzzle());
    }
    // ─── UI helpers ─────────────────────────────────────────
    showScreen(id) {
        const home = document.getElementById('home-screen');
        const game = document.getElementById('game-container');
        const homeBtn = document.getElementById('home-btn');
        const progressEl = document.getElementById('story-progress');
        if (home)
            home.style.display = id === 'home-screen' ? 'flex' : 'none';
        if (game)
            game.style.display = id === 'game-container' ? 'flex' : 'none';
        if (homeBtn)
            homeBtn.style.display = id === 'home-screen' ? 'none' : 'block';
        if (progressEl)
            progressEl.style.display = id === 'game-container' && this.currentMode === 'STORY' ? 'block' : 'none';
        this.updateScoreDisplay();
    }
    showWinOverlay(title, message, btnText, onAction) {
        const overlay = document.getElementById('win-overlay');
        const winTitle = document.getElementById('win-title');
        const winMsg = document.getElementById('win-message');
        const winBtn = document.getElementById('win-next-btn');
        if (winTitle)
            winTitle.textContent = title;
        if (winMsg)
            winMsg.textContent = message;
        if (winBtn)
            winBtn.textContent = btnText;
        if (overlay) {
            overlay.classList.add('visible');
            const newBtn = winBtn?.cloneNode(true);
            if (winBtn && newBtn) {
                winBtn.replaceWith(newBtn);
                newBtn.addEventListener('click', () => {
                    overlay.classList.remove('visible');
                    onAction();
                });
            }
        }
    }
    updateProgressDisplay() {
        const progressEl = document.getElementById('story-progress');
        if (progressEl) {
            const typeLabel = this.currentPuzzleType
                ? ' · ' + PUZZLE_TYPE_LABELS[this.currentPuzzleType]
                : '';
            progressEl.textContent = `第 ${this.storyPuzzlesCompleted + 1} 题${typeLabel}`;
            progressEl.style.display = 'block';
        }
        const scoreEl = document.getElementById('score-display');
        if (scoreEl)
            scoreEl.textContent = String(this.brainScore);
    }
    updateScoreDisplay() {
        const el = document.getElementById('score-display');
        if (el)
            el.textContent = String(this.brainScore);
    }
    difficultyToPicarat(difficulty) {
        return difficulty * 10 + 10;
    }
}
//# sourceMappingURL=GameManager.js.map