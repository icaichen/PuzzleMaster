/**
 * PuzzleView.ts — 增强版文字谜题视图
 *
 * 对标雷顿教授风格：
 * - 剧情框展示场景故事
 * - 问题展示
 * - Picarat 难度分
 * - 三级渐进提示（提示币）
 * - 答案解析
 */
export class PuzzleView {
    constructor(container) {
        this.hintsRevealed = 0;
        this.hintCoins = 3;
        this.answered = false;
        this.correct = false;
        this.answerText = '';
        this.questionText = '';
        this.scenarioText = '';
        this.hintTexts = [];
        this.titleText = '';
        this.picaratText = '';
        this.categoryText = '';
        this.container = container;
        this.injectStyles();
    }
    // ─── Public API ──────────────────────────────────────────
    setPuzzle(params) {
        this.titleText = params.title;
        this.scenarioText = params.scenario;
        this.questionText = params.question;
        this.answerText = params.answer;
        this.hintTexts = params.hints;
        this.picaratText = String(params.picarat);
        this.categoryText = params.category;
        this.hintsRevealed = 0;
        this.hintCoins = 3;
        this.answered = false;
        this.correct = false;
    }
    onWin(cb) { this.onWinCallback = cb; }
    onNext(cb) { this.onNextCallback = cb; }
    render() {
        this.doRender(false);
    }
    // ─── Private — render ─────────────────────────────────────
    doRender(isNext) {
        this.container.innerHTML = '';
        const wrapper = this.el('div', {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: '28px 24px',
            maxWidth: '560px',
            width: '100%',
            margin: '0 auto',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--parchment-border)',
            boxShadow: '0 4px 24px rgba(60,30,10,0.1)',
        });
        // ── Header: category + picarat ──
        const header = this.el('div', {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        });
        const catBadge = this.el('span', {
            fontSize: '0.7rem', color: 'var(--gold-dim)',
            background: 'var(--bg-card-alt)', padding: '3px 10px', borderRadius: '10px',
            border: '1px solid var(--parchment-border)',
            fontFamily: 'var(--font-serif)',
        });
        catBadge.textContent = this.categoryLabel(this.categoryText);
        const picaratBadge = this.el('span', {
            fontSize: '0.8rem', fontWeight: '700', color: 'var(--gold-dim)',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontFamily: 'var(--font-serif)',
        });
        picaratBadge.innerHTML = '★ ' + this.picaratText;
        header.appendChild(catBadge);
        header.appendChild(picaratBadge);
        // ── Title ──
        const titleEl = this.el('h2', {
            fontSize: '1.2rem', color: 'var(--ink)', textAlign: 'center',
            letterSpacing: '0.04em', fontFamily: 'var(--font-serif)', margin: '0',
            lineHeight: '1.4',
        });
        titleEl.textContent = this.titleText;
        // ── Scenario box ──
        const scenarioBox = this.el('div', {
            background: 'var(--bg-card-alt)',
            borderRadius: '6px',
            padding: '18px',
            border: '1px solid var(--parchment-border)',
            borderLeft: '3px solid var(--gold)',
        });
        const scenarioText = this.el('p', {
            fontSize: '0.9rem', lineHeight: '1.8', color: 'var(--ink-light)',
            fontFamily: 'var(--font-serif)', margin: '0', fontStyle: 'italic',
        });
        scenarioText.textContent = this.scenarioText;
        scenarioBox.appendChild(scenarioText);
        // ── Question ──
        const questionBox = this.el('div', {
            marginTop: '4px',
        });
        const questionLabel = this.el('span', {
            fontSize: '0.72rem', color: 'var(--accent)', fontWeight: '700',
            textTransform: 'uppercase', letterSpacing: '0.1em',
            display: 'block', marginBottom: '4px',
            fontFamily: 'var(--font-serif)',
        });
        questionLabel.textContent = '✦ 问题';
        const questionText = this.el('p', {
            fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--text-primary)',
            fontWeight: '600', margin: '0',
        });
        questionText.textContent = this.questionText;
        questionBox.appendChild(questionLabel);
        questionBox.appendChild(questionText);
        // ── Input area ──
        const inputRow = this.el('div', {
            display: 'flex', gap: '10px', width: '100%',
        });
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.placeholder = '输入你的答案...';
        Object.assign(inputEl.style, {
            flex: '1', padding: '12px 16px', borderRadius: '6px',
            border: '1px solid var(--parchment-border)',
            background: 'var(--bg-surface)', color: 'var(--ink)',
            fontSize: '1rem', fontFamily: 'var(--font)', outline: 'none',
            transition: 'all 0.2s ease',
        });
        const submitBtn = this.el('button', {
            padding: '12px 24px', borderRadius: '6px', border: '1px solid var(--gold-dim)',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            color: '#fffef5', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
            transition: 'all 0.2s ease', fontFamily: 'var(--font)',
            whiteSpace: 'nowrap',
        });
        submitBtn.textContent = isNext ? '下一题' : '提交';
        // ── Feedback message ──
        const feedbackEl = this.el('div', {
            textAlign: 'center', fontSize: '0.9rem', minHeight: '24px',
            transition: 'opacity 0.3s', opacity: '0', marginTop: '4px',
        });
        // ── Hint area ──
        const hintArea = this.el('div', {
            display: 'flex', flexDirection: 'column', gap: '8px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '16px', marginTop: '4px',
        });
        const hintHeader = this.el('div', {
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '4px',
        });
        const hintLabel = this.el('span', {
            fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600',
        });
        hintLabel.textContent = '💡 提示币: ' + this.hintCoins;
        const hintBtn = this.el('button', {
            padding: '6px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
            background: this.hintCoins > 0 && this.hintsRevealed < this.hintTexts.length
                ? 'var(--bg-card)' : 'rgba(255,255,255,0.03)',
            color: this.hintCoins > 0 && this.hintsRevealed < this.hintTexts.length
                ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font)',
            transition: 'all 0.2s ease',
        });
        hintBtn.textContent = '使用提示币';
        if (this.hintCoins <= 0 || this.hintsRevealed >= this.hintTexts.length) {
            hintBtn.disabled = true;
        }
        const hintContent = this.el('div', { display: 'flex', flexDirection: 'column', gap: '6px' });
        // ── Answer reveal area (shown after correct answer) ──
        const answerReveal = this.el('div', {
            display: 'none', marginTop: '12px', padding: '16px',
            background: 'rgba(76,175,80,0.08)', borderRadius: '8px',
            border: '1px solid rgba(76,175,80,0.2)',
        });
        const answerLabel = this.el('div', {
            fontSize: '0.75rem', color: '#4CAF50', fontWeight: '700',
            marginBottom: '8px',
        });
        answerLabel.textContent = '✓ 答案解析';
        const answerContent = this.el('p', {
            fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--text-primary)',
            margin: '0',
        });
        answerContent.textContent = this.answerText;
        answerReveal.appendChild(answerLabel);
        answerReveal.appendChild(answerContent);
        // ── Next button container ──
        const nextBtnRow = this.el('div', {
            display: 'none', justifyContent: 'center', marginTop: '8px',
        });
        const nextBtn = this.el('button', {
            padding: '12px 32px', borderRadius: '6px', border: '1px solid var(--gold-dim)',
            background: 'linear-gradient(135deg, var(--gold), var(--gold-dim))',
            color: '#fffef5', fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
            fontFamily: 'var(--font)', transition: 'all 0.2s ease',
        });
        nextBtn.textContent = '→ 下一题';
        nextBtnRow.appendChild(nextBtn);
        // ── Events ──
        const checkAnswer = () => {
            if (this.answered)
                return;
            const userInput = inputEl.value.trim();
            const cleanInput = userInput.toLowerCase().replace(/\s+/g, '');
            const cleanAnswer = this.answerText.toLowerCase().replace(/\s+/g, '');
            // Very lenient matching: check if answer contains user input or vice versa
            const isCorrect = cleanInput.length > 0 && (cleanInput === cleanAnswer ||
                cleanAnswer.includes(cleanInput) ||
                cleanInput.includes(cleanAnswer));
            this.answered = true;
            this.correct = isCorrect;
            if (isCorrect) {
                feedbackEl.textContent = '✦ 正确！ Brilliant！';
                feedbackEl.style.color = '#4CAF50';
                feedbackEl.style.opacity = '1';
                inputEl.style.borderColor = '#4CAF50';
                inputEl.style.boxShadow = '0 0 12px rgba(76,175,80,0.4)';
                inputEl.disabled = true;
                submitBtn.disabled = true;
                hintBtn.disabled = true;
                // Show answer reveal
                answerReveal.style.display = 'block';
                nextBtnRow.style.display = 'flex';
                if (this.onWinCallback) {
                    setTimeout(() => this.onWinCallback(), 600);
                }
            }
            else {
                feedbackEl.innerHTML =
                    '✗ 不对哦。再想想？<br><span style="font-size:0.75rem;color:var(--text-muted)">正确答案：' + this.answerText + '</span>';
                feedbackEl.style.color = '#ff4444';
                feedbackEl.style.opacity = '1';
                inputEl.style.borderColor = '#ff4444';
                inputEl.disabled = true;
                submitBtn.disabled = true;
                hintBtn.disabled = true;
                // Still show answer and next button
                answerReveal.style.display = 'block';
                answerLabel.textContent = '✗ 正确答案';
                answerLabel.style.color = '#ff4444';
                nextBtnRow.style.display = 'flex';
            }
        };
        const revealHint = () => {
            if (this.hintCoins <= 0 || this.hintsRevealed >= this.hintTexts.length)
                return;
            this.hintCoins--;
            const hintLevel = this.hintsRevealed; // 0, 1, 2
            this.hintsRevealed++;
            const hintItem = this.el('div', {
                padding: '10px 14px', borderRadius: '6px',
                background: 'rgba(255,215,0,0.06)',
                border: '1px solid rgba(255,215,0,0.15)',
                fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-primary)',
                animation: 'fadeIn 0.3s ease',
            });
            const levelLabel = ['提示一', '提示二', '提示三（超级提示）'][hintLevel];
            hintItem.innerHTML = '<span style="color:var(--gold);font-weight:600">' + levelLabel + '：</span> ' +
                this.hintTexts[hintLevel];
            hintContent.appendChild(hintItem);
            hintLabel.textContent = '💡 提示币: ' + this.hintCoins;
            if (this.hintCoins <= 0 || this.hintsRevealed >= this.hintTexts.length) {
                hintBtn.disabled = true;
                hintBtn.style.background = 'rgba(255,255,255,0.03)';
                hintBtn.style.color = 'var(--text-muted)';
                hintBtn.textContent = '提示已用完';
            }
        };
        submitBtn.addEventListener('click', checkAnswer);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter')
                checkAnswer();
        });
        hintBtn.addEventListener('click', revealHint);
        nextBtn.addEventListener('click', () => {
            if (this.onNextCallback)
                this.onNextCallback();
        });
        // ── Assemble ──
        inputRow.appendChild(inputEl);
        inputRow.appendChild(submitBtn);
        hintHeader.appendChild(hintLabel);
        hintHeader.appendChild(hintBtn);
        hintArea.appendChild(hintHeader);
        hintArea.appendChild(hintContent);
        wrapper.appendChild(header);
        wrapper.appendChild(titleEl);
        wrapper.appendChild(scenarioBox);
        wrapper.appendChild(questionBox);
        wrapper.appendChild(inputRow);
        wrapper.appendChild(feedbackEl);
        wrapper.appendChild(hintArea);
        wrapper.appendChild(answerReveal);
        wrapper.appendChild(nextBtnRow);
        this.container.appendChild(wrapper);
        // Auto-focus input
        setTimeout(() => inputEl.focus(), 100);
    }
    // ─── Helpers ─────────────────────────────────────────────
    categoryLabel(cat) {
        const map = {
            lateral_thinking: '🧠 侧向思维',
            logic_deduction: '🔍 逻辑推理',
            math_puzzle: '📐 数学趣味',
            word_play: '💬 文字游戏',
            common_sense: '💡 常识推理',
            measurement: '⚖️ 测量推理',
        };
        return map[cat] || cat;
    }
    el(tag, styles) {
        const e = document.createElement(tag);
        Object.assign(e.style, styles);
        return e;
    }
    injectStyles() {
        if (document.getElementById('puzzle-view-styles'))
            return;
        const style = document.createElement('style');
        style.id = 'puzzle-view-styles';
        style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
      }
      .shake-error {
        animation: shake 0.4s ease-in-out;
        border-color: #ff4444 !important;
      }
    `;
        document.head.appendChild(style);
    }
}
//# sourceMappingURL=PuzzleView.js.map