/**
 * RiverCrossingEngine.ts — 过河问题引擎
 *
 * 经典过河谜题：在有限条件下将所有角色运送到对岸。
 * 使用参数化模板，角色和约束随难度变化。
 */

import { PuzzleData, PuzzleType, PuzzleEngine } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';

interface RiverPuzzleTemplate {
  title: string;
  scenario: string;
  actors: string[];
  /** 谁不能和谁单独在一起 (predator → prey) */
  conflicts: Array<{ predator: string; prey: string }>;
  /** 谁必须和谁一起 (pair) */
  mustTogether: Array<[string, string]>;
  boatCapacity: number;
  answer: string;
  difficulty: number;
}

const TEMPLATES: RiverPuzzleTemplate[] = [
  // ── 经典狼羊菜 ──
  {
    title: '农夫过河',
    scenario: '一位农夫要带一只狼、一只羊和一棵白菜过河。船每次只能载农夫加一样物品。如果农夫不在场，狼会吃羊，羊会吃白菜。',
    actors: ['农夫', '狼', '羊', '白菜'],
    conflicts: [
      { predator: '狼', prey: '羊' },
      { predator: '羊', prey: '白菜' },
    ],
    mustTogether: [],
    boatCapacity: 2, // 农夫 + 1
    answer: '1.农夫带羊过河，农夫返回；2.农夫带狼过河，带羊返回；3.农夫带白菜过河，农夫返回；4.农夫带羊过河。全部安全到达。',
    difficulty: 3,
  },
  // ── 传教士与野人 ──
  {
    title: '传教士与野人',
    scenario: '3 个传教士和 3 个野人在河岸一侧。船最多载 2 人。如果任何一边野人数量超过传教士，传教士会被吃掉。如何让所有人安全过河？',
    actors: ['传教士×3', '野人×3'],
    conflicts: [],
    mustTogether: [],
    boatCapacity: 2,
    answer: '1.两野人过，一野人回；2.两野人过，一野人回；3.两传教士过，一传教士一野人回；4.两传教士过，一野人回；5.两野人过，一野人回；6.两野人过。全部到达。',
    difficulty: 6,
  },
  // ── 一家五口 ──
  {
    title: '一家五口过桥',
    scenario: '一家五口要在夜间过桥，只有一个手电筒。爸爸需要 1 分钟，妈妈 2 分钟，爷爷 5 分钟，奶奶 8 分钟，小孩 10 分钟。每次最多 2 人同时过桥，过桥时间以较慢者为准。手电筒必须由过桥的人带回来。如何让所有人最快过桥？',
    actors: ['爸爸(1min)', '妈妈(2min)', '爷爷(5min)', '奶奶(8min)', '小孩(10min)'],
    conflicts: [],
    mustTogether: [],
    boatCapacity: 2,
    answer: '1.爸爸+妈妈过(2min)，爸爸回(1min)；2.爷爷+奶奶过(8min)，妈妈回(2min)；3.爸爸+小孩过(10min)，爸爸回(1min)；4.爸爸+妈妈过(2min)。总时间：2+1+8+2+10+1+2=26分钟。',
    difficulty: 8,
  },
  // ── 嫉妒的丈夫 ──
  {
    title: '嫉妒的丈夫',
    scenario: '三对夫妻要过河。船最多载 2 人。规则：没有任何一位妻子可以在她丈夫不在场的情况下与其他男人在一起。如何让所有人过河？',
    actors: ['H1(丈夫1)', 'W1(妻子1)', 'H2(丈夫2)', 'W2(妻子2)', 'H3(丈夫3)', 'W3(妻子3)'],
    conflicts: [
      { predator: 'H1', prey: 'W2' },
      { predator: 'H1', prey: 'W3' },
      { predator: 'H2', prey: 'W1' },
      { predator: 'H2', prey: 'W3' },
      { predator: 'H3', prey: 'W1' },
      { predator: 'H3', prey: 'W2' },
    ],
    mustTogether: [],
    boatCapacity: 2,
    answer: '1.H1+W1过，H1回；2.W2+W3过，W1回；3.H2+H3过，H2+W2回；4.H1+H2过，W3回；5.W1+W2过，H1回；6.H1+W3过。全部到达。',
    difficulty: 9,
  },
  // ── 简单版：两个物品 ──
  {
    title: '猫和老鼠',
    scenario: '你要带一只猫和一只老鼠过河。船只能载你和一只动物。如果你不在场，猫会吃老鼠。怎样过河？',
    actors: ['你', '猫', '老鼠'],
    conflicts: [{ predator: '猫', prey: '老鼠' }],
    mustTogether: [],
    boatCapacity: 2,
    answer: '1.你带猫过河，你返回；2.你带老鼠过河。简单！因为猫和老鼠不在同一边时不需要看守。',
    difficulty: 1,
  },
];

export class RiverCrossingEngine implements PuzzleEngine {
  readonly type = PuzzleType.RIVER_CROSSING;
  readonly isBank = false;

  private rng: SeededRandom = new SeededRandom(0);

  generate(difficulty: number, seed?: number): PuzzleData | null {
    const actualSeed = seed ?? SeededRandom.randomSeed();
    this.rng = new SeededRandom(actualSeed);

    const candidates = TEMPLATES.filter(t =>
      t.difficulty >= difficulty - 2 && t.difficulty <= difficulty + 2
    );
    if (candidates.length === 0) {
      // Fall back to any template
      const t = this.rng.pick(TEMPLATES);
      return this.buildPuzzle(t, actualSeed);
    }

    const t = this.rng.pick(candidates);
    return this.buildPuzzle(t, actualSeed);
  }

  private buildPuzzle(t: RiverPuzzleTemplate, seed: number): PuzzleData {
    return {
      id: `river_${seed}`,
      type: PuzzleType.RIVER_CROSSING,
      difficulty: t.difficulty,
      title: t.title,
      description: t.scenario,
      initial_state: {
        question: t.scenario + '\n\n请写出每一步的过河方案。',
        actors: t.actors,
        boatCapacity: t.boatCapacity,
      },
      goal_state: { answer: t.answer },
      hints: [
        `提示一：思考第一步谁应该先过河。如果只有一对冲突，先带「猎物」过河通常是对的。`,
        `提示二：对于复杂情况，从对岸往回带人的选择也很关键——带谁回来会制造危险？`,
        `提示三：${t.answer}`,
      ],
      seed,
    };
  }
}
