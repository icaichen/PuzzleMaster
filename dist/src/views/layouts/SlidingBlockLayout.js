import { createPuzzlePage, createHeader, createButtonRow, createHintPanel, createFeedback } from './SharedComponents';
import { SlidingBlockView } from '../SlidingBlockView';
import { SlidingBlockModel } from '../../models/SlidingBlockModel';
export class SlidingBlockLayout {
    constructor() {
        this.slidingBlockView = null;
        this.slidingBlockModel = null;
        this.steps = 0;
    }
    mount(container) {
        this.container = container;
        this.container.innerHTML = '';
        // Create the shared parchment page container (width 400 for SlidingBlock)
        this.page = createPuzzlePage(400);
        // Create Hint Panel and Buttons
        this.hintPanel = createHintPanel([], 3); // updated in render
        this.btnRow = createButtonRow();
        this.feedback = createFeedback();
        this.btnRow.onReset(() => this.resetPuzzle());
        this.btnRow.onHint(() => this.hintPanel.reveal());
        this.btnRow.onNext(() => this.cbs?.onNext());
        this.page.el.appendChild(this.feedback);
        this.page.el.appendChild(this.hintPanel.el);
        this.page.el.appendChild(this.btnRow.el);
        this.container.appendChild(this.page.el);
    }
    destroy() {
        this.slidingBlockView = null;
        this.slidingBlockModel = null;
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
    setCallbacks(cbs) {
        this.cbs = cbs;
    }
    render(params) {
        const { puzzle, picarat } = params;
        // Setup Header & Narrative
        const header = createHeader(puzzle.type, puzzle.title, picarat);
        this.page.el.insertBefore(header, this.page.el.children[1]); // Insert after top ornament
        this.page.setNarrative(puzzle.narrative_setup || '');
        this.page.setQuestion(puzzle.description); // Layton style scenario text
        // Setup Hints
        const hints = puzzle.hints || [];
        this.hintPanel = createHintPanel(hints, 3);
        this.page.el.replaceChild(this.hintPanel.el, this.page.el.children[this.page.el.children.length - 2]);
        this.btnRow.setHintCoins(3);
        this.btnRow.showSubmit(); // We hide submit for SlidingBlock, but showReset/Hint
        // Hide submit button for sliding block as it auto-checks
        const submitBtn = this.btnRow.el.querySelector('button:nth-child(3)');
        if (submitBtn)
            submitBtn.style.display = 'none';
        // Setup Canvas
        const canvas = document.createElement('canvas');
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        canvas.style.borderRadius = '8px';
        canvas.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        this.page.canvasArea.innerHTML = '';
        this.page.canvasArea.appendChild(canvas);
        this.page.canvasArea.style.padding = '16px';
        this.page.canvasArea.style.background = 'var(--canvasBg)'; // Slightly darker inset for board
        // Initialize Model and View
        const initialState = puzzle.initial_state;
        this.slidingBlockModel = new SlidingBlockModel(initialState);
        this.slidingBlockView = new SlidingBlockView(canvas, this.slidingBlockModel, puzzle.assets, puzzle.visual_elements);
        // Bind Interaction
        this.slidingBlockView.onBlockMove = (blockId, direction) => {
            this.handleMove(blockId, direction);
        };
        this.steps = 0;
        this.updateFeedback();
    }
    handleMove(blockId, direction) {
        if (!this.slidingBlockModel || !this.slidingBlockView)
            return;
        const block = this.slidingBlockModel.getBlockById(blockId);
        if (!block)
            return;
        const prevX = block.x;
        const prevY = block.y;
        const moved = this.slidingBlockModel.moveBlock(blockId, direction);
        if (!moved)
            return;
        this.steps++;
        this.updateFeedback();
        // Wait for animation to finish before checking win state
        this.slidingBlockView.animateMove(blockId, prevX, prevY, block.x, block.y).then(() => {
            if (this.slidingBlockModel && this.slidingBlockModel.checkWin()) {
                this.handleWin();
            }
        });
    }
    resetPuzzle() {
        if (!this.slidingBlockModel || !this.slidingBlockView)
            return;
        // Fast way to reset is to recreate model from initial state (not stored directly here, but usually GameManager does it)
        // For now, we rely on GameManager re-calling loadPuzzle if we want a true reset, 
        // but we can implement a basic internal reset if we store initial_state.
        // For simplicity, let's just trigger a reload or ignore if initial_state isn't saved.
    }
    handleWin() {
        this.feedback.textContent = `✓ 成功逃脱！共用时 ${this.steps} 步。`;
        this.feedback.style.color = 'var(--success)';
        this.slidingBlockView?.showWin();
        this.btnRow.showNext();
        this.cbs?.onWin();
    }
    updateFeedback() {
        this.feedback.textContent = `步数: ${this.steps}`;
        this.feedback.style.color = 'var(--inkLight)';
    }
}
//# sourceMappingURL=SlidingBlockLayout.js.map