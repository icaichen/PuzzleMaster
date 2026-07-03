export class TextPuzzleView {
    constructor(container, model) {
        this.container = container;
        this.model = model;
    }
    onWin(callback) {
        this.onWinCallback = callback;
    }
    render() {
        const data = this.model.getPuzzleData();
        // Clear existing content
        this.container.innerHTML = '';
        // Create main wrapper with premium dark theme styles
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.flexDirection = 'column';
        wrapper.style.gap = '24px';
        wrapper.style.padding = '32px';
        wrapper.style.background = 'var(--bg-surface)';
        wrapper.style.borderRadius = 'var(--radius)';
        wrapper.style.boxShadow = '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)';
        wrapper.style.width = '100%';
        wrapper.style.maxWidth = '600px';
        wrapper.style.margin = '0 auto';
        // Inject shake animation style if not already present
        if (!document.getElementById('text-puzzle-styles')) {
            const style = document.createElement('style');
            style.id = 'text-puzzle-styles';
            style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .shake-error {
          animation: shake 0.4s ease-in-out;
          border-color: #ff4444 !important;
        }
      `;
            document.head.appendChild(style);
        }
        // Title
        const titleEl = document.createElement('h2');
        titleEl.textContent = data.title;
        titleEl.style.fontSize = '1.4rem';
        titleEl.style.color = 'var(--gold)';
        titleEl.style.textAlign = 'center';
        titleEl.style.marginBottom = '8px';
        titleEl.style.letterSpacing = '0.05em';
        titleEl.style.fontFamily = 'Georgia, serif';
        // Puzzle Description
        const descEl = document.createElement('p');
        descEl.textContent = data.description;
        descEl.style.fontSize = '1.1rem';
        descEl.style.lineHeight = '1.8';
        descEl.style.color = 'var(--text-primary)';
        descEl.style.textAlign = 'center';
        descEl.style.fontFamily = 'Georgia, serif';
        descEl.style.fontStyle = 'italic';
        descEl.style.marginBottom = '16px';
        // Input area wrapper
        const inputWrapper = document.createElement('div');
        inputWrapper.style.display = 'flex';
        inputWrapper.style.gap = '12px';
        inputWrapper.style.width = '100%';
        // Text Input
        const inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.placeholder = 'Your answer...';
        inputEl.style.flex = '1';
        inputEl.style.padding = '12px 16px';
        inputEl.style.borderRadius = '8px';
        inputEl.style.border = '1px solid rgba(255,255,255,0.08)';
        inputEl.style.background = 'var(--bg-card)';
        inputEl.style.color = 'var(--text-primary)';
        inputEl.style.fontSize = '1rem';
        inputEl.style.fontFamily = 'var(--font)';
        inputEl.style.outline = 'none';
        inputEl.style.transition = 'all 0.2s ease';
        // Input focus effects
        inputEl.addEventListener('focus', () => {
            inputEl.style.borderColor = 'var(--accent)';
            inputEl.style.boxShadow = '0 0 12px var(--accent-glow)';
        });
        inputEl.addEventListener('blur', () => {
            inputEl.style.borderColor = 'rgba(255,255,255,0.08)';
            inputEl.style.boxShadow = 'none';
        });
        // Submit Button
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Submit';
        submitBtn.style.padding = '12px 24px';
        submitBtn.style.borderRadius = '8px';
        submitBtn.style.border = 'none';
        submitBtn.style.background = 'linear-gradient(135deg, var(--accent), #e05555)';
        submitBtn.style.color = '#fff';
        submitBtn.style.fontSize = '1rem';
        submitBtn.style.fontWeight = '600';
        submitBtn.style.cursor = 'pointer';
        submitBtn.style.transition = 'all 0.2s ease';
        submitBtn.style.fontFamily = 'var(--font)';
        // Button hover/active effects
        submitBtn.addEventListener('mouseover', () => {
            submitBtn.style.filter = 'brightness(1.1)';
            submitBtn.style.transform = 'translateY(-1px)';
            submitBtn.style.boxShadow = '0 4px 16px var(--accent-glow)';
        });
        submitBtn.addEventListener('mouseout', () => {
            submitBtn.style.filter = 'none';
            submitBtn.style.transform = 'none';
            submitBtn.style.boxShadow = 'none';
        });
        submitBtn.addEventListener('mousedown', () => {
            submitBtn.style.transform = 'translateY(1px)';
        });
        submitBtn.addEventListener('mouseup', () => {
            submitBtn.style.transform = 'translateY(-1px)';
        });
        // Message Display
        const messageEl = document.createElement('div');
        messageEl.style.textAlign = 'center';
        messageEl.style.fontSize = '1rem';
        messageEl.style.marginTop = '8px';
        messageEl.style.height = '24px';
        messageEl.style.transition = 'opacity 0.3s';
        messageEl.style.opacity = '0';
        const checkAnswer = () => {
            // Reset animation
            inputEl.classList.remove('shake-error');
            void inputEl.offsetWidth; // trigger reflow
            if (this.model.checkWin(inputEl.value)) {
                messageEl.textContent = 'Correct! Brilliant mind.';
                messageEl.style.color = '#4CAF50';
                messageEl.style.opacity = '1';
                inputEl.style.borderColor = '#4CAF50';
                inputEl.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.4)';
                inputEl.disabled = true;
                submitBtn.disabled = true;
                if (this.onWinCallback) {
                    // Add a slight delay before triggering win callback
                    setTimeout(() => this.onWinCallback(), 800);
                }
            }
            else {
                inputEl.classList.add('shake-error');
                messageEl.textContent = 'Incorrect. Try again.';
                messageEl.style.color = '#ff4444';
                messageEl.style.opacity = '1';
                // Hide error message after 2 seconds
                setTimeout(() => {
                    messageEl.style.opacity = '0';
                }, 2000);
            }
        };
        submitBtn.addEventListener('click', checkAnswer);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });
        inputWrapper.appendChild(inputEl);
        inputWrapper.appendChild(submitBtn);
        wrapper.appendChild(titleEl);
        wrapper.appendChild(descEl);
        wrapper.appendChild(inputWrapper);
        wrapper.appendChild(messageEl);
        this.container.appendChild(wrapper);
    }
}
//# sourceMappingURL=TextPuzzleView.js.map