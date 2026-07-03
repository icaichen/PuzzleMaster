/**
 * main.ts — 华容道应用入口
 */

import { GameManager } from './controllers/GameManager';

import { VisualPuzzleView } from './views/VisualPuzzleView';
import { PuzzleType } from './models/PuzzleData';

function main(): void {
  const manager = new GameManager();
  manager.goHome();
  // 暴露到 window 供截图脚本和调试使用
  (window as any).__gameManager = manager;
  
  const hybridBtn = document.getElementById('hybrid-demo-btn');
  if (hybridBtn) {
    hybridBtn.addEventListener('click', () => {
      manager.startHybridDemo();
    });
  }

  const pills = document.querySelectorAll('.type-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const type = pill.getAttribute('data-type') as PuzzleType;
      if (type) {
        manager.playSpecificCategory(type);
      }
    });
  });
  
  (window as any).runDemo = () => {
    document.getElementById('home-screen')!.style.display = 'none';
    const container = document.getElementById('game-container')!;
    container.style.display = 'flex';
    container.innerHTML = '';
    
    manager.currentPuzzle = {
      id: 'demo_pipeline_01',
      type: PuzzleType.SLIDING_BLOCK,
      difficulty: 3,
      title: '逃离海盗船',
      description: '水手被海盗桶围住了，帮他挪开木桶逃出甲板！',
      hints: ['提示1', '提示2'],
      seed: 42,
      scene_theme: '逃离海盗船',
      narrative_setup: '水手被海盗桶围住了，帮他挪开木桶逃出甲板！',
      initial_state: {
        boardWidth: 4,
        boardHeight: 5,
        exitX: 1,
        exitY: 3,
        blocks: [
          { id: 'target', x: 1, y: 0, width: 2, height: 2, isTarget: true }, // sailor
          { id: 'vertical_1', x: 0, y: 0, width: 1, height: 2, isTarget: false }, // barrel_v
          { id: 'vertical_2', x: 3, y: 0, width: 1, height: 2, isTarget: false }, // barrel_v
          { id: 'horizontal', x: 1, y: 2, width: 2, height: 1, isTarget: false }, // barrel_h
          { id: 'small_1', x: 0, y: 2, width: 1, height: 1, isTarget: false }, // crate_small
          { id: 'small_2', x: 3, y: 2, width: 1, height: 1, isTarget: false }  // crate_small
        ]
      },
      goal_state: {},
      assets: {
        background_url: '/assets/generated/bg_demo_pipeline_01.jpg',
        sprites: [
          { id: 'sailor', url: '/assets/generated/sailor_demo_pipeline_01.jpg' },
          { id: 'barrel_v', url: '/assets/generated/barrel_v_demo_pipeline_01.jpg' },
          { id: 'barrel_h', url: '/assets/generated/barrel_h_demo_pipeline_01.jpg' },
          { id: 'crate_small', url: '/assets/generated/crate_small_demo_pipeline_01.jpg' }
        ]
      },
      visual_elements: [
        { type: 'character', id: 'sailor', position: 'target', state: 'normal' },
        { type: 'prop', id: 'barrel_v', position: 'vertical_1', state: 'normal' },
        { type: 'prop', id: 'barrel_v', position: 'vertical_2', state: 'normal' },
        { type: 'prop', id: 'barrel_h', position: 'horizontal', state: 'normal' },
        { type: 'prop', id: 'crate_small', position: 'small_1', state: 'normal' },
        { type: 'prop', id: 'crate_small', position: 'small_2', state: 'normal' }
      ]
    };

    // Use internal loadPuzzle to bypass random generation
    (manager as any).loadPuzzle(manager.currentPuzzle);
  };

  const keyInput = document.getElementById('api-key-input') as HTMLInputElement;
  const saveBtn = document.getElementById('save-key-btn') as HTMLButtonElement;
  const statusBadge = document.getElementById('api-status-badge') as HTMLElement;

  const updateStatus = () => {
    const saved = localStorage.getItem('GEMINI_API_KEY') || '';
    if (saved) {
      statusBadge.textContent = '实时联机';
      statusBadge.className = 'status-badge status-online';
      keyInput.value = '••••••••••••••••••••••••';
    } else {
      statusBadge.textContent = '离线模式';
      statusBadge.className = 'status-badge status-offline';
      keyInput.value = '';
    }
  };

  if (saveBtn && keyInput) {
    updateStatus();
    saveBtn.addEventListener('click', () => {
      const val = keyInput.value.trim();
      if (val === '••••••••••••••••••••••••') {
        return;
      }
      if (val) {
        localStorage.setItem('GEMINI_API_KEY', val);
        alert('密钥配置已保存！快去体验 AI 联机生成吧！');
      } else {
        localStorage.removeItem('GEMINI_API_KEY');
        alert('配置已清空，回到本地离线模式。');
      }
      updateStatus();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
