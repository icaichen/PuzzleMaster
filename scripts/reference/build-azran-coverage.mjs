import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { azranMechanismPatterns } from './azran-mechanism-map.mjs';
import { azranPatternContracts } from './azran-pattern-contracts.mjs';

const root = new URL('../../', import.meta.url);
const rawPath = new URL('.cache/reference-audit/azran-165.raw.json', root);
const raw = JSON.parse(await readFile(rawPath, 'utf8'));

const assignment = new Map();
for (const [id, name, kernel, generationFit, numbers] of azranMechanismPatterns) {
  for (const numericNumber of numbers) {
    const number = String(numericNumber).padStart(3, '0');
    if (assignment.has(number)) throw new Error(`Puzzle ${number} assigned to both ${assignment.get(number).id} and ${id}`);
    assignment.set(number, { id, name, kernel, generationFit });
  }
}

const expectedNumbers = Array.from({ length: 165 }, (_, index) => String(index + 1).padStart(3, '0'));
const missing = expectedNumbers.filter(number => !assignment.has(number));
const unexpected = [...assignment.keys()].filter(number => !expectedNumbers.includes(number));
if (missing.length || unexpected.length) throw new Error(`Coverage error. Missing: ${missing.join(',')} Unexpected: ${unexpected.join(',')}`);
const patternIds = azranMechanismPatterns.map(pattern => pattern[0]);
const contractIds = Object.keys(azranPatternContracts);
if (patternIds.some(id => !azranPatternContracts[id]) || contractIds.some(id => !patternIds.includes(id))) {
  throw new Error('Mechanism patterns and structural contracts are not one-to-one');
}

const puzzles = raw.puzzles.map(puzzle => ({
  number: puzzle.number,
  title: puzzle.title,
  listedType: puzzle.listedType,
  picarats: puzzle.picarats,
  ...assignment.get(puzzle.number),
  sourceUrl: puzzle.sourceUrl
}));

const kernelCounts = {};
const fitCounts = {};
for (const puzzle of puzzles) {
  kernelCounts[puzzle.kernel] = (kernelCounts[puzzle.kernel] ?? 0) + 1;
  fitCounts[puzzle.generationFit] = (fitCounts[puzzle.generationFit] ?? 0) + 1;
}

const outputData = new URL('data/reference/', root);
const outputDocs = new URL('docs/reference/', root);
await mkdir(outputData, { recursive: true });
await mkdir(outputDocs, { recursive: true });

await writeFile(new URL('azran-coverage.json', outputData), `${JSON.stringify({
  source: raw.source,
  puzzleCount: puzzles.length,
  mechanismPatternCount: azranMechanismPatterns.length,
  runtimeKernelCount: Object.keys(kernelCounts).length,
  coverage: 1,
  kernelCounts: Object.fromEntries(Object.entries(kernelCounts).sort()),
  generationFitCounts: Object.fromEntries(Object.entries(fitCounts).sort()),
  puzzles
}, null, 2)}\n`);

const matrixRows = puzzles.map(puzzle =>
  `| ${puzzle.number} | ${puzzle.title.replaceAll('|', '\\|')} | ${puzzle.listedType} | ${puzzle.id} | ${puzzle.name} | ${puzzle.kernel} | ${puzzle.generationFit} |`
);
await writeFile(new URL('azran-coverage-matrix.md', outputDocs), `# 《超文明A的遗产》165题机制覆盖矩阵\n\n` +
  `来源：[Professor Layton and the Azran Legacy puzzle index](${raw.source})  \n` +
  `用途：研究参考作品的机制广度，不复制题面、布局、图像或答案。  \n` +
  `覆盖：**${puzzles.length}/165（100%）**  \n` +
  `具体机制模式：**${azranMechanismPatterns.length}**  \n` +
  `运行时能力内核：**${Object.keys(kernelCounts).length}**\n\n` +
  `> “Listed Type”是原目录的表层交互标签；“机制模式”和“运行时内核”是本项目根据详细规则提取的结构分类。\n\n` +
  `| # | 题名 | Listed Type | 机制ID | 机制模式 | 运行时内核 | 生成适配 |\n` +
  `|---:|---|---|---|---|---|---|\n${matrixRows.join('\n')}\n`);

const inventoryRows = azranMechanismPatterns.map(([id, name, kernel, generationFit, numbers]) =>
  `| ${id} | ${name} | ${kernel} | ${generationFit} | ${numbers.map(number => String(number).padStart(3, '0')).join(', ')} |`
);
await writeFile(new URL('azran-mechanism-inventory.md', outputDocs), `# 参考机制模式清单\n\n` +
  `共 ${azranMechanismPatterns.length} 个具体机制模式，覆盖全部165题。具体模式不是最终产品引擎；它们会继续归并为可复用运行时内核和生成器族。\n\n` +
  `| ID | 机制模式 | 运行时内核 | 生成适配 | 参考题号 |\n` +
  `|---|---|---|---|---|\n${inventoryRows.join('\n')}\n\n` +
  `## 运行时内核覆盖\n\n` + Object.entries(kernelCounts).sort().map(([kernel, count]) => `- ${kernel}: ${count}题`).join('\n') + '\n');

const contractSections = azranMechanismPatterns.map(([id, name, kernel, generationFit, numbers]) => {
  const [state, actions, transition, goal, insight] = azranPatternContracts[id];
  return `## ${id} ${name}\n\n` +
    `- 参考题号：${numbers.map(number => String(number).padStart(3, '0')).join(', ')}\n` +
    `- 运行时内核：${kernel}\n` +
    `- 生成适配：${generationFit}\n` +
    `- 状态：${state}\n` +
    `- 动作：${actions}\n` +
    `- 转移：${transition}\n` +
    `- 目标：${goal}\n` +
    `- 核心洞察：${insight}\n`;
});
await writeFile(new URL('azran-pattern-contracts.md', outputDocs), `# 96个参考机制结构契约\n\n` +
  `每个模式均明确状态、动作、状态转移、目标和核心洞察。内容是结构性概括，不复制原题题面、布局或答案。\n\n` +
  contractSections.join('\n'));

console.log(JSON.stringify({
  puzzles: puzzles.length,
  mechanismPatterns: azranMechanismPatterns.length,
  structuralContracts: contractIds.length,
  runtimeKernels: Object.keys(kernelCounts).length,
  coverage: '100%',
  generationFitCounts: fitCounts
}, null, 2));
