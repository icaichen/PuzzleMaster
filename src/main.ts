/**
 * main.ts — 华容道应用入口
 */

import { GameManager } from './controllers/GameManager';

function main(): void {
  const manager = new GameManager();
  manager.goHome();
  // 暴露到 window 供截图脚本和调试使用
  (window as any).__gameManager = manager;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
