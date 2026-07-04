import { mkdir, writeFile } from 'node:fs/promises';
import { azranMechanismPatterns } from '../reference/azran-mechanism-map.mjs';
import { interactionAdapterMap } from './interaction-adapter-map.mjs';

const mechanisms = new Map(azranMechanismPatterns.map(([id, name, kernel, generationFit, puzzles]) => [id, { id, name, kernel, generationFit, puzzles }]));
const mappings = interactionAdapterMap.map(([mechanismId, adapterId, baseSurface, primaryInput, visualDependency]) => ({
  ...mechanisms.get(mechanismId), adapterId, baseSurface, primaryInput, visualDependency
}));
const groups = new Map();
for (const mapping of mappings) {
  if (!groups.has(mapping.adapterId)) groups.set(mapping.adapterId, []);
  groups.get(mapping.adapterId).push(mapping);
}
const adapters = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([id, entries]) => ({
  id,
  name: `${entries[0].name}交互适配器`,
  baseSurfaces: [...new Set(entries.map(entry => entry.baseSurface))],
  runtimeKernels: [...new Set(entries.map(entry => entry.kernel))],
  primaryInputs: [...new Set(entries.map(entry => entry.primaryInput))],
  visualDependency: ['LOW','MEDIUM','HIGH'].sort((a,b) => ['LOW','MEDIUM','HIGH'].indexOf(b)-['LOW','MEDIUM','HIGH'].indexOf(a)).find(level => entries.some(entry => entry.visualDependency === level)),
  mechanismIds: entries.map(entry => entry.id),
  reuseClass: entries.length > 1 ? 'SHARED_ADAPTER' : 'DEDICATED_ADAPTER',
  productionStrategy: entries.every(entry => entry.generationFit === 'PROCEDURAL') ? 'BATCH_PROCEDURAL'
    : entries.some(entry => entry.generationFit === 'BESPOKE') ? 'BESPOKE_ONLY' : 'CURATED_HYBRID',
  app: true,
  wechat: true
}));
const surfaces = [...new Set(mappings.map(mapping => mapping.baseSurface))].sort();
const payload = {
  version: '1.0.0',
  sourceMechanisms: mappings.length,
  adapterCount: adapters.length,
  baseSurfaceCount: surfaces.length,
  baseSurfaces: surfaces,
  adapters,
  mappings: mappings.map(mapping => ({
    mechanismId: mapping.id, mechanismName: mapping.name, runtimeKernel: mapping.kernel,
    adapterId: mapping.adapterId, baseSurface: mapping.baseSurface, primaryInput: mapping.primaryInput,
    visualDependency: mapping.visualDependency, generationFit: mapping.generationFit, referencePuzzles: mapping.puzzles
  }))
};
await mkdir(new URL('../../data/adapters/', import.meta.url), { recursive: true });
await writeFile(new URL('../../data/adapters/interaction-adapters.json', import.meta.url), `${JSON.stringify(payload, null, 2)}\n`);

const shared = adapters.filter(adapter => adapter.reuseClass === 'SHARED_ADAPTER');
const dedicated = adapters.filter(adapter => adapter.reuseClass === 'DEDICATED_ADAPTER');
const visualCounts = Object.fromEntries(['LOW','MEDIUM','HIGH'].map(level => [level, mappings.filter(mapping => mapping.visualDependency === level).length]));
const productionCounts = Object.fromEntries(['BATCH_PROCEDURAL','CURATED_HYBRID','BESPOKE_ONLY'].map(strategy => [strategy, adapters.filter(adapter => adapter.productionStrategy === strategy).length]));
const waves = {
  WAVE_1_SHARED_BATCH: adapters.filter(adapter => adapter.productionStrategy === 'BATCH_PROCEDURAL' && adapter.reuseClass === 'SHARED_ADAPTER'),
  WAVE_2_DEDICATED_BATCH: adapters.filter(adapter => adapter.productionStrategy === 'BATCH_PROCEDURAL' && adapter.reuseClass === 'DEDICATED_ADAPTER'),
  WAVE_3_CURATED_HYBRID: adapters.filter(adapter => adapter.productionStrategy === 'CURATED_HYBRID'),
  WAVE_4_BESPOKE: adapters.filter(adapter => adapter.productionStrategy === 'BESPOKE_ONLY')
};
const lines = [
  '# PuzzleMaster 交互适配器覆盖矩阵 v1', '',
  `- 参考机制：${mappings.length}`, `- 基础交互表面：${surfaces.length}`, `- 实际机制适配器：${adapters.length}`,
  `- 可由多个机制共用的适配器：${shared.length}`, `- 当前必须专属实现的适配器：${dedicated.length}`,
  `- 视觉依赖：LOW ${visualCounts.LOW} / MEDIUM ${visualCounts.MEDIUM} / HIGH ${visualCounts.HIGH}`, '',
  `- 适配器生产策略：批量程序化 ${productionCounts.BATCH_PROCEDURAL} / 策划混合 ${productionCounts.CURATED_HYBRID} / 专属制作 ${productionCounts.BESPOKE_ONLY}`, '',
  '## 复用结论', '',
  '同一运行时内核不代表同一交互适配器。基础表面负责网格、图、自由画布等通用能力；适配器负责机制特有的操作、状态反馈和视觉语义；题目实例只提供参数。', '',
  '## 建议实施波次', '',
  `1. WAVE 1：共享且可批量程序化，${waves.WAVE_1_SHARED_BATCH.length} 个适配器。先证明复用与量产。`,
  `2. WAVE 2：专属但可批量程序化，${waves.WAVE_2_DEDICATED_BATCH.length} 个适配器。按题库价值逐个加入。`,
  `3. WAVE 3：需要策划/视觉审核的混合适配器，${waves.WAVE_3_CURATED_HYBRID.length} 个。主要服务 App 精选题。`,
  `4. WAVE 4：专属制作，${waves.WAVE_4_BESPOKE.length} 个。不承诺微信持续量产。`, '',
  '### WAVE 1 清单', '',
  ...waves.WAVE_1_SHARED_BATCH.sort((a,b) => b.mechanismIds.length-a.mechanismIds.length || a.id.localeCompare(b.id)).map(adapter => `- ${adapter.id}：覆盖 ${adapter.mechanismIds.join(', ')}`), '',
  '## 适配器目录', '',
  '| 适配器 | 基础表面 | 内核 | 机制数 | 复用类型 | 生产策略 | 视觉依赖 |', '|---|---|---|---:|---|---|---|',
  ...adapters.map(adapter => `| ${adapter.id} | ${adapter.baseSurfaces.join(', ')} | ${adapter.runtimeKernels.join(', ')} | ${adapter.mechanismIds.length} | ${adapter.reuseClass} | ${adapter.productionStrategy} | ${adapter.visualDependency} |`),
  '', '## 96种机制映射', '',
  '| 机制 | 名称 | 内核 | 适配器 | 基础表面 | 主要输入 | 视觉依赖 |', '|---|---|---|---|---|---|---|',
  ...payload.mappings.map(mapping => `| ${mapping.mechanismId} | ${mapping.mechanismName} | ${mapping.runtimeKernel} | ${mapping.adapterId} | ${mapping.baseSurface} | ${mapping.primaryInput} | ${mapping.visualDependency} |`), ''
];
await writeFile(new URL('../../docs/interaction-adapter-coverage-v1.md', import.meta.url), lines.join('\n'));
console.log(JSON.stringify({ mechanisms: mappings.length, adapters: adapters.length, baseSurfaces: surfaces.length, sharedAdapters: shared.length, dedicatedAdapters: dedicated.length, visualCounts, productionCounts }, null, 2));
