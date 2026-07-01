/**
 * IPuzzleLayout.ts — 谜题布局接口
 *
 * 每个谜题类型有独立的 Layout 类。
 * Layout 负责：DOM 结构 + Canvas 交互 + 答案校验。
 * GameManager 只通过此接口与 Layout 交互。
 */

import type { PuzzleData, PuzzleType } from '../../models/PuzzleData';

export type LayoutMode = 'path_finding' | 'number_grid' | 'tangram';

/** Layout 对外暴露的回调 */
export interface PuzzleLayoutCallbacks {
  onWin: () => void;
  onNext: () => void;
}

/** 所有 Layout 实现此接口 */
export interface IPuzzleLayout {
  /** 将 Layout 的 DOM 挂载到容器中 */
  mount(container: HTMLElement): void;
  /** 销毁 DOM、解绑事件 */
  destroy(): void;
  /** 设置回调 */
  setCallbacks(cbs: PuzzleLayoutCallbacks): void;
}

/** 谜题渲染参数（所有 Layout 共用） */
export interface PuzzleRenderParams {
  puzzle: PuzzleData;
  picarat: number;
}
