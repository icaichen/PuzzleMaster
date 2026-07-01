/**
 * batchGenerate.ts — AI 批量谜题生成管线
 *
 * 用法:
 *   npx tsx scripts/batchGenerate.ts --count 50 --category lateral_thinking --difficulty 3
 *   npx tsx scripts/batchGenerate.ts --count 100  # 全类别随机生成
 *
 * 环境变量:
 *   OPENAI_API_KEY  — API 密钥
 *   OPENAI_BASE_URL — API 地址（默认 https://api.openai.com/v1）
 *   OPENAI_MODEL    — 模型名称（默认 gpt-4o）
 *
 * 生成流程:
 *   1. 根据 category 选择 prompt 模板
 *   2. 调用 LLM 批量生成
 *   3. 自动校验（结构完整、答案存在、无重复）
 *   4. 追加到 data/puzzleBank.json
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── 类型定义 ──────────────────────────────────────────────────
interface BankPuzzle {
  id: string;
  type: string;
  category: string;
  difficulty: number;
  picarat: number;
  title: string;
  scenario: string;
  question: string;
  answer: string;
  hints: string[];
  tags: string[];
}

interface PuzzleBank {
  version: string;
  generatedAt: string;
  source: string;
  totalPuzzles: number;
  puzzles: BankPuzzle[];
}

// ─── Prompt 模板 ────────────────────────────────────────────────
const PROMPT_TEMPLATES: Record<string, string> = {
  lateral_thinking: `你是一位侧向思维谜题设计师，风格参考雷顿教授系列和多湖辉《头脑体操》。

生成 {{count}} 道侧向思维谜题。要求：
1. 每道题必须有一个出人意料但合理的答案
2. 答案必须唯一且明确
3. 谜题用中文叙述，融入一个小故事场景
4. 难度等级 {{difficulty}}（1-10，10最难）
5. 不要使用已被广泛传播的经典谜题，要原创
6. 每道题提供3级提示，第3级几乎给出答案

以 JSON 数组格式输出，每个元素包含：
{
  "title": "谜题标题（4-8字）",
  "scenario": "故事场景描述（50-150字）",
  "question": "要玩家回答的问题",
  "answer": "正确答案",
  "hints": ["提示1（点拨方向）", "提示2（缩小范围）", "提示3（几乎明示）"],
  "tags": ["标签1", "标签2"]
}`,

  logic_deduction: `你是一位逻辑推理谜题设计师，风格参考雷顿教授系列。

生成 {{count}} 道逻辑推理谜题。要求：
1. 谜题必须有唯一解，可通过纯逻辑推理得出
2. 可以是骑士与无赖、帽子问题、说谎者悖论等类型
3. 谜题用中文叙述
4. 难度等级 {{difficulty}}（1-10）
5. 原创题目，不要直接复制经典题
6. 每道题提供3级提示

以 JSON 数组格式输出，每个元素包含：
{
  "title": "谜题标题",
  "scenario": "场景描述",
  "question": "问题",
  "answer": "答案（含简要推理）",
  "hints": ["提示1", "提示2", "提示3"],
  "tags": ["logic", "..."]
}`,

  math_puzzle: `你是一位数学趣味谜题设计师，风格参考雷顿教授系列。

生成 {{count}} 道数学趣味谜题。要求：
1. 不是纯计算题，必须有巧妙的思路或陷阱
2. 答案必须唯一
3. 中文叙述
4. 难度等级 {{difficulty}}（1-10）
5. 原创题目
6. 每道题提供3级提示

以 JSON 数组格式输出，每个元素包含：
{
  "title": "标题",
  "scenario": "场景",
  "question": "问题",
  "answer": "答案",
  "hints": ["提示1", "提示2", "提示3"],
  "tags": ["math", "..."]
}`,

  word_play: `你是一位文字游戏谜题设计师，风格参考雷顿教授系列。

生成 {{count}} 道文字/字母游戏谜题。要求：
1. 可以是字母序列、文字推理、语言陷阱等
2. 答案必须唯一
3. 中文叙述（如涉及英文字母可以保留）
4. 难度等级 {{difficulty}}（1-10）
5. 原创题目
6. 每道题提供3级提示

以 JSON 数组格式输出，每个元素包含：
{
  "title": "标题",
  "scenario": "场景",
  "question": "问题",
  "answer": "答案",
  "hints": ["提示1", "提示2", "提示3"],
  "tags": ["word", "..."]
}`,

  common_sense: `你是一位常识推理谜题设计师，风格参考雷顿教授系列。

生成 {{count}} 道常识/生活推理谜题。要求：
1. 利用日常常识中的盲点或思维定势
2. 答案必须唯一且合乎常理
3. 中文叙述
4. 难度等级 {{difficulty}}（1-10）
5. 原创题目
6. 每道题提供3级提示

以 JSON 数组格式输出，每个元素包含：
{
  "title": "标题",
  "scenario": "场景",
  "question": "问题",
  "answer": "答案",
  "hints": ["提示1", "提示2", "提示3"],
  "tags": ["common_sense", "..."]
}`,

  measurement: `你是一位测量推理谜题设计师，风格参考雷顿教授系列。

生成 {{count}} 道测量/称重谜题。要求：
1. 涉及量水、称重、计时等测量问题
2. 答案必须唯一且有明确步骤
3. 中文叙述
4. 难度等级 {{difficulty}}（1-10）
5. 原创或经典题的变体
6. 每道题提供3级提示

以 JSON 数组格式输出，每个元素包含：
{
  "title": "标题",
  "scenario": "场景",
  "question": "问题",
  "answer": "答案（含步骤）",
  "hints": ["提示1", "提示2", "提示3"],
  "tags": ["measurement", "..."]
}`,
};

// ─── Picarat 计算 ──────────────────────────────────────────────
function difficultyToPicarat(difficulty: number): number {
  return Math.round(difficulty * 5 + 5);
}

// ─── LLM 调用 ──────────────────────────────────────────────────
async function callLLM(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  if (!apiKey) {
    throw new Error('缺少 OPENAI_API_KEY 环境变量');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的谜题生成器。严格按照要求的JSON格式输出，不要输出任何其他内容。',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`API 调用失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─── 校验单个谜题 ──────────────────────────────────────────────
function validatePuzzle(puzzle: any): string | null {
  if (!puzzle.title || typeof puzzle.title !== 'string') return '缺少 title';
  if (!puzzle.scenario || typeof puzzle.scenario !== 'string') return '缺少 scenario';
  if (!puzzle.question || typeof puzzle.question !== 'string') return '缺少 question';
  if (!puzzle.answer || typeof puzzle.answer !== 'string') return '缺少 answer';
  if (!Array.isArray(puzzle.hints) || puzzle.hints.length !== 3) return 'hints 必须是3个元素的数组';
  if (!Array.isArray(puzzle.tags)) return '缺少 tags';
  return null;
}

// ─── 解析 LLM 输出 ─────────────────────────────────────────────
function parseLLMOutput(raw: string): any[] {
  // 尝试直接解析
  let text = raw.trim();

  // 去掉可能的 markdown 代码块标记
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // 找到第一个 [ 和最后一个 ]
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new Error('LLM 输出中没有找到 JSON 数组');
  }

  const jsonStr = text.substring(start, end + 1);
  return JSON.parse(jsonStr);
}

// ─── 去重检查 ──────────────────────────────────────────────────
function isDuplicate(puzzle: BankPuzzle, existing: BankPuzzle[]): boolean {
  return existing.some(
    (p) => p.title === puzzle.title || p.question === puzzle.question
  );
}

// ─── 主流程 ────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const countArg = args.find((a) => a.startsWith('--count'));
  const categoryArg = args.find((a) => a.startsWith('--category'));
  const difficultyArg = args.find((a) => a.startsWith('--difficulty'));

  const count = countArg ? parseInt(countArg.split('=')[1] || countArg.split(' ')[1]) : 20;
  const category = categoryArg
    ? (categoryArg.split('=')[1] || categoryArg.split(' ')[1])
    : null;
  const difficulty = difficultyArg
    ? parseInt(difficultyArg.split('=')[1] || difficultyArg.split(' ')[1])
    : 3;

  const categories = category
    ? [category]
    : Object.keys(PROMPT_TEMPLATES);

  // 加载现有题库
  const bankPath = path.join(__dirname, '..', 'data', 'puzzleBank.json');
  const bank: PuzzleBank = JSON.parse(fs.readFileSync(bankPath, 'utf-8'));
  const existingTitles = new Set(bank.puzzles.map((p) => p.title));

  console.log(`现有题库: ${bank.puzzles.length} 道题`);
  console.log(`目标生成: ${count} 道题`);
  console.log(`类别: ${categories.join(', ')}`);
  console.log(`难度: ${difficulty}`);
  console.log('---');

  const perCategory = Math.ceil(count / categories.length);
  let generated = 0;
  let skipped = 0;

  for (const cat of categories) {
    const template = PROMPT_TEMPLATES[cat];
    if (!template) {
      console.log(`未知类别: ${cat}, 跳过`);
      continue;
    }

    const prompt = template
      .replace('{{count}}', String(perCategory))
      .replace('{{difficulty}}', String(difficulty));

    console.log(`正在生成 [${cat}] ${perCategory} 道...`);

    try {
      const raw = await callLLM(prompt);
      const items = parseLLMOutput(raw);

      for (const item of items) {
        const error = validatePuzzle(item);
        if (error) {
          console.log(`  跳过: ${error}`);
          skipped++;
          continue;
        }

        if (existingTitles.has(item.title)) {
          console.log(`  跳过: 重复标题「${item.title}」`);
          skipped++;
          continue;
        }

        const puzzle: BankPuzzle = {
          id: `bank_${String(bank.puzzles.length + 1).padStart(3, '0')}`,
          type: 'LOGIC_TEXT',
          category: cat,
          difficulty,
          picarat: difficultyToPicarat(difficulty),
          title: item.title,
          scenario: item.scenario,
          question: item.question,
          answer: item.answer,
          hints: item.hints,
          tags: item.tags || [cat],
        };

        bank.puzzles.push(puzzle);
        existingTitles.add(puzzle.title);
        generated++;
        console.log(`  + ${puzzle.title} (${puzzle.id})`);
      }
    } catch (e: any) {
      console.error(`  生成失败: ${e.message}`);
    }
  }

  // 保存
  bank.totalPuzzles = bank.puzzles.length;
  bank.generatedAt = new Date().toISOString().split('T')[0];
  fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2), 'utf-8');

  console.log('---');
  console.log(`生成完成: +${generated} 道, 跳过 ${skipped} 道`);
  console.log(`题库总数: ${bank.puzzles.length} 道`);
  console.log(`保存到: ${bankPath}`);
}

main().catch((e) => {
  console.error('运行失败:', e);
  process.exit(1);
});
