/**
 * TemplateEngine.ts — 数学模板谜题引擎
 *
 * 程序化生成数学/逻辑谜题，支持多种题型：
 * - 等式填空 (Equation Fill)
 * - 数列推理 (Sequence)
 * - 魔方阵 (Magic Square)
 * - 数独变体 (Mini Sudoku)
 *
 * 每种题型都有参数化难度，输出标准 PuzzleData。
 */

import { PuzzleData, PuzzleType, PuzzleEngine } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
import { StoryGenerator } from '../models/StoryGenerator';

type PuzzleGenerator = (rng: SeededRandom, difficulty: number, seed: number) => {
  title: string;
  description: string;
  question: string;
  answer: string;
  hints: string[];
};

// ─── 题型 1: 等式填空 ─────────────────────────────────────────

const equationFill: PuzzleGenerator = (rng, difficulty, seed) => {
  // 根据难度决定数字范围和运算符
  const maxNum = 5 + difficulty * 3;
  const useMul = difficulty >= 4;
  const useDiv = difficulty >= 6;
  const numBlanks = difficulty >= 5 ? 2 : 1;

  let a = rng.nextInt(1, maxNum);
  let b = rng.nextInt(1, maxNum);
  let c = rng.nextInt(1, maxNum);

  const ops = ['+', '-'];
  if (useMul) ops.push('×');
  if (useDiv) {
    // 确保能整除
    b = rng.nextInt(2, Math.min(maxNum, 12));
    a = b * rng.nextInt(1, maxNum);
    ops.push('÷');
  }

  const op1 = rng.pick(ops);
  const op2 = rng.pick(ops);

  // 计算结果
  const calc = (x: number, op: string, y: number): number => {
    switch (op) {
      case '+': return x + y;
      case '-': return x - y;
      case '×': return x * y;
      case '÷': return Math.floor(x / y);
    }
    return 0;
  };

  // 确保减法不出现负数（低难度）
  if (op1 === '-' && a < b) [a, b] = [b, a];
  let mid = calc(a, op1, b);
  if (op2 === '-' && mid < c) {
    const tmp = mid; mid = c; c = tmp;
  }
  const result = calc(mid, op2, c);

  // 隐藏部分数字作为空格
  const values = [a, b, c, result];
  const labels = ['A', 'B', 'C', 'D'];
  const blankIndices: number[] = [];

  while (blankIndices.length < numBlanks) {
    const idx = rng.nextInt(0, values.length - 1);
    if (!blankIndices.includes(idx)) blankIndices.push(idx);
  }

  const displayParts: string[] = [];
  const answers: string[] = [];
  for (let i = 0; i < 4; i++) {
    if (blankIndices.includes(i)) {
      displayParts.push(`(  )`);
      answers.push(`${labels[i]} = ${values[i]}`);
    } else {
      displayParts.push(`${values[i]}`);
    }
  }

  const equation = `${displayParts[0]} ${op1} ${displayParts[1]} ${op2} ${displayParts[2]} = ${displayParts[3]}`;

  // 如果 op2 优先级高于 op1，加括号使运算顺序明确
  const highPrec = (op: string) => op === '×' || op === '÷';
  const equationWithParens = (highPrec(op2) && !highPrec(op1))
    ? `${displayParts[0]} ${op1} ( ${displayParts[1]} ${op2} ${displayParts[2]} ) = ${displayParts[3]}`
    : equation;

  const hints = [
    `提示一：先计算已知部分，${displayParts[0]} ${op1} ${displayParts[1]} 的中间结果可以帮助你推理。`,
    `提示二：${labels[blankIndices[0]]} 的值与等式两边的平衡有关。`,
    `提示三：${answers[0]}`,
  ];

  return {
    title: '等式填空',
    description: `在空格中填入正确的数字，使等式成立。难度 ${difficulty}。`,
    question: equationWithParens,
    answer: answers.join('；'),
    hints,
  };
};

// ─── 题型 2: 数列推理 ─────────────────────────────────────────

const sequencePuzzle: PuzzleGenerator = (rng, difficulty, seed) => {
  const length = 4 + Math.floor(difficulty / 2);
  const maxStart = 2 + difficulty * 2;
  const maxStep = 1 + difficulty;

  const patternType = rng.nextInt(0, Math.min(3, Math.floor(difficulty / 2)));

  let sequence: number[] = [];
  let patternDesc = '';

  switch (patternType) {
    case 0: { // 等差数列
      const start = rng.nextInt(1, maxStart);
      const step = rng.nextInt(1, maxStep);
      sequence = Array.from({ length }, (_, i) => start + step * i);
      patternDesc = `等差数列，公差为 ${step}`;
      break;
    }
    case 1: { // 等比数列
      const start = rng.nextInt(1, maxStart);
      const ratio = rng.nextInt(2, Math.min(3, 1 + Math.floor(difficulty / 3)));
      sequence = Array.from({ length }, (_, i) => start * Math.pow(ratio, i));
      patternDesc = `等比数列，公比为 ${ratio}`;
      break;
    }
    case 2: { // 斐波那契式
      const a = rng.nextInt(1, maxStart);
      const b = rng.nextInt(1, maxStart);
      sequence = [a, b];
      for (let i = 2; i < length; i++) {
        sequence.push(sequence[i - 1] + sequence[i - 2]);
      }
      patternDesc = `每一项等于前两项之和`;
      break;
    }
    case 3: { // 交替数列
      const a1 = rng.nextInt(1, maxStart);
      const d1 = rng.nextInt(1, maxStep);
      const a2 = rng.nextInt(1, maxStart);
      const d2 = rng.nextInt(-maxStep, maxStep);
      sequence = [];
      for (let i = 0; i < length; i++) {
        sequence.push(i % 2 === 0 ? a1 + (i / 2) * d1 : a2 + Math.floor(i / 2) * d2);
      }
      patternDesc = `奇数位和偶数位分别是两个不同的等差数列`;
      break;
    }
  }

  // 隐藏最后一个数字
  const answer = sequence[sequence.length - 1];
  const display = sequence.slice(0, -1).join(', ') + ', ?';

  const hints = [
    `提示一：${patternDesc}。`,
    `提示二：观察相邻数字之间的差值或比值。`,
    `提示三：答案是 ${answer}。`,
  ];

  return {
    title: '数列推理',
    description: `找出数列的规律，推断问号处的数字。难度 ${difficulty}。`,
    question: display,
    answer: String(answer),
    hints,
  };
};

// ─── 题型 3: 魔方阵 ───────────────────────────────────────────

const magicSquarePuzzle: PuzzleGenerator = (rng, difficulty, seed) => {
  const size = difficulty >= 6 ? 4 : 3;
  const n = size;
  const total = n * n;
  const magicSum = (n * (total + 1)) / 2;

  // 生成魔方阵（Siamese method for odd, double-even for 4x4）
  let square: number[][] = [];

  if (n === 3) {
    // 经典 3x3 Siamese method
    square = Array.from({ length: n }, () => new Array(n).fill(0));
    let r = 0, c = Math.floor(n / 2);
    for (let num = 1; num <= total; num++) {
      square[r][c] = num;
      const nr = (r - 1 + n) % n;
      const nc = (c + 1) % n;
      if (square[nr][nc] !== 0) {
        r = (r + 1) % n;
      } else {
        r = nr;
        c = nc;
      }
    }
  } else {
    // 4x4 double-even method
    square = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => i * n + j + 1)
    );
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const inCorner = (i < n / 4 || i >= 3 * n / 4) && (j < n / 4 || j >= 3 * n / 4);
        const inCenter = (i >= n / 4 && i < 3 * n / 4) && (j >= n / 4 && j < 3 * n / 4);
        if (inCorner || inCenter) {
          square[i][j] = total - square[i][j] + 1;
        }
      }
    }
  }

  // 随机打乱行交换和列交换（保持魔方阵性质）
  // 行交换：交换对称的行对
  if (rng.next() > 0.5) {
    [square[0], square[n - 1]] = [square[n - 1], square[0]];
  }
  if (n > 2 && rng.next() > 0.5) {
    [square[1], square[n - 2]] = [square[n - 2], square[1]];
  }

  // 挖空：根据难度决定挖多少格
  const numBlanks = Math.min(total - 1, 2 + difficulty);
  const blanks: Array<{ r: number; c: number }> = [];
  const allPositions: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      allPositions.push({ r, c });
    }
  }
  const shuffled = rng.shuffle(allPositions);
  for (let i = 0; i < numBlanks; i++) {
    blanks.push(shuffled[i]);
  }

  const blankSet = new Set(blanks.map(b => `${b.r},${b.c}`));
  const answerMap: Record<string, number> = {};
  for (const b of blanks) {
    answerMap[`${b.r + 1}行${b.c + 1}列`] = square[b.r][b.c];
  }

  // 构建显示文本
  let display = '';
  for (let r = 0; r < n; r++) {
    const row: string[] = [];
    for (let c = 0; c < n; c++) {
      if (blankSet.has(`${r},${c}`)) {
        row.push(' __ ');
      } else {
        row.push(square[r][c].toString().padStart(2, ' '));
      }
    }
    display += row.join(' | ') + '\n';
  }

  const answerStr = Object.entries(answerMap)
    .map(([k, v]) => `${k}=${v}`)
    .join('；');

  const hints = [
    `提示一：每行、每列、对角线的和都等于 ${magicSum}。`,
    `提示二：使用的数字是 1 到 ${total}，每个数字只出现一次。`,
    `提示三：${answerStr}`,
  ];

  return {
    title: '魔方阵',
    description: `填入空格中的数字，使每行、每列和两条对角线的和都相等。难度 ${difficulty}。`,
    question: display.trim(),
    answer: answerStr,
    hints,
  };
};

// ─── 题型 4: 逻辑推理（谁在说谎）─────────────────────────────

const liarPuzzle: PuzzleGenerator = (rng, difficulty, seed) => {
  const numPeople = Math.min(3 + Math.floor(difficulty / 3), 5);
  const names = ['甲', '乙', '丙', '丁', '戊'].slice(0, numPeople);

  // 随机选一个说谎者
  const liarIdx = rng.nextInt(0, numPeople - 1);

  // 生成陈述
  const statements: string[] = [];
  for (let i = 0; i < numPeople; i++) {
    if (i === liarIdx) {
      // 说谎者：指控其他人
      const target = (i + 1) % numPeople;
      statements.push(`${names[i]}说：「是${names[target]}做的。」`);
    } else {
      // 诚实者：指控说谎者
      statements.push(`${names[i]}说：「是${names[liarIdx]}做的。」`);
    }
  }

  // 打乱陈述顺序
  const shuffled = rng.shuffle(statements);

  const hints = [
    `提示一：只有一个人在说谎，其他人都说了真话。`,
    `提示二：说真话的人都会指向同一个人。`,
    `提示三：说谎者是说${names[liarIdx]}。`,
  ];

  return {
    title: '谁在说谎',
    description: `${numPeople}个人中只有一个是肇事者。只有一个人在说谎。找出说谎者。难度 ${difficulty}。`,
    question: shuffled.join('\n'),
    answer: `说谎者是${names[liarIdx]}`,
    hints,
  };
};

// ─── 题型注册表 ──────────────────────────────────────────────

const GENERATORS: Array<{ name: string; minDiff: number; maxDiff: number; gen: PuzzleGenerator }> = [
  { name: 'equation', minDiff: 1, maxDiff: 10, gen: equationFill },
  { name: 'sequence', minDiff: 1, maxDiff: 10, gen: sequencePuzzle },
  { name: 'magicSquare', minDiff: 3, maxDiff: 10, gen: magicSquarePuzzle },
  { name: 'liar', minDiff: 2, maxDiff: 10, gen: liarPuzzle },
];

// ─── 主引擎类 ─────────────────────────────────────────────────

export class TemplateEngine implements PuzzleEngine {
  readonly type = PuzzleType.MATH;
  readonly isBank = false;

  private rng: SeededRandom = new SeededRandom(SeededRandom.randomSeed());

  generate(difficulty: number, seed?: number): PuzzleData {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);

    // 筛选适合当前难度的题型
    const available = GENERATORS.filter(
      g => difficulty >= g.minDiff && difficulty <= g.maxDiff
    );
    const generator = this.rng.pick(available);

    const result = generator.gen(this.rng, difficulty, actualSeed);

    const storyGen = new StoryGenerator(actualSeed);
    const story = storyGen.generate(
      PuzzleType.MATH,
      result.title,
      undefined,
      result.question
    );

    return {
      id: `math_${generator.name}_${actualSeed}`,
      type: PuzzleType.MATH,
      difficulty,
      title: story.title,
      description: story.scenario,
      initial_state: { question: result.question },
      goal_state: { answer: result.answer },
      hints: result.hints,
      seed: actualSeed,
    };
  }
}
