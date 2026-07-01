/**
 * StoryGenerator.ts — 谜题剧情生成器
 *
 * 为每种谜题类型生成 2-3 句的短篇情境设定。
 * 模仿雷顿教授风格：简洁、有画面感、给出 puzzle 动机。
 * 每个引擎调用 StoryGenerator 为自己的谜题生成 scenario。
 */

import { PuzzleType } from './PuzzleData';
import { SeededRandom } from './SeededRandom';

export interface StoryContext {
  /** 谜题标题 */
  title: string;
  /** 简短情境（2-3句） */
  scenario: string;
  /** 谜题正文（包含具体问题描述） */
  question: string;
}

// ─── 故事模板库 ─────────────────────────────────────────────

interface StoryTemplate {
  /** 情境前缀（场景设置） */
  setups: string[][];
  /** 连接句（连接场景到具体问题） */
  bridges: string[];
  /** 结尾（提出挑战） */
  endings: string[];
}

const TEMPLATES: Record<string, StoryTemplate> = {

  // ═══ 滑块拼图 ═══
  sliding_block: {
    setups: [
      [
        '古老的神庙深处，一道石门挡住了去路。',
        '传说只有解开滑块之谜，门才会打开。',
      ],
      [
        '教授在阁楼里发现了一个古老的木盒。',
        '盒面上的滑块似乎构成了某种图案——但顺序是乱的。',
      ],
      [
        '宫廷画师正在修复一幅被撕碎的名画。',
        '碎片散落在画框里，需要滑回正确的位置。',
      ],
      [
        '孩子们在花园里玩一个滑动拼图玩具。',
        '据说拼好之后，花园的喷泉会涌出金币。',
      ],
    ],
    bridges: [
      '每个滑块只能在空格的方向上移动。',
      '你需要滑动木块，让它们归位。',
    ],
    endings: [
      '你能把目标滑块移出棋盘吗？',
      '请找出最少的滑动步骤完成拼图。',
      '怎样移动才能达成目标？',
    ],
  },

  // ═══ 逻辑网格 ═══
  logic_grid: {
    setups: [
      [
        '五位绅士在俱乐部里喝茶，分别来自不同的城市，喜欢不同的茶。',
        '他们各养了一只宠物，但没人愿意直接说出细节。',
      ],
      [
        '火车包厢里有四位乘客，每人携带不同的行李，目的地各不相同。',
        '乘务员记录了一些零星的对话——这些碎片需要拼凑起来。',
      ],
      [
        '六个孩子在操场上做游戏，每人穿着不同颜色的衣服，站在不同位置。',
        '从他们的对话中可以推断出每个人的具体情况。',
      ],
    ],
    bridges: [
      '根据以下线索，推理出完整的对应关系：',
    ],
    endings: [
      '谁养了鱼？谁喝红茶？',
      '诸位的座位到底是怎么排的？',
      '请完成这张逻辑表格。',
    ],
  },

  // ═══ 数学 ═══
  math: {
    setups: [
      [
        '教授在路边捡到一块刻着数字的石板。',
        '上面的数字似乎遵循某种神秘规律。',
      ],
      [
        '数学课上，老师在黑板上留下了一串数字。',
        '"找到规律的人可以提前下课"，她说。',
      ],
    ],
    bridges: [
      '观察数字序列，找出隐藏的规律。',
    ],
    endings: [
      '下一个数字是什么？',
      '请填上缺失的数字。',
    ],
  },

  // ═══ 火柴棒 ═══
  matchstick: {
    setups: [
      [
        '酒馆里，一个水手用火柴摆出了一个等式。',
        '"这个等式是错的"，他说，"但移动一根火柴就能让它成立。"',
      ],
      [
        '孩子们在地上用树枝摆出了算式。',
        '一阵风吹乱了其中一根——奇妙的是，乱掉的算式看起来还是错的。',
      ],
    ],
    bridges: ['观察算式，移动一根火柴来修正它。'],
    endings: ['最少需要移动几根？', '怎样移动才能让等式成立？'],
  },

  // ═══ 天平称重 ═══
  weighing: {
    setups: [
      [
        '王国的铸币厂发现一批金币中混入了赝品。',
        '赝品的重量与真币不同，肉眼无法分辨。',
      ],
      [
        '化学实验室里，研究员需要找出唯一一粒被污染的药片。',
        '它的重量与正常药片不同，只有一架精密天平可用。',
      ],
    ],
    bridges: [
      '你有一个天平（没有砝码），只能称有限的几次。',
    ],
    endings: [
      '哪一枚是假的？更轻还是更重？',
      '请写出称量策略。',
    ],
  },

  // ═══ 过河问题 ═══
  river_crossing: {
    setups: [
      [
        '黄昏时分，一位牧羊人站在河边。',
        '他身边有一只狼、一只羊和一筐草——他们都必须过河，但小船每次只能多载一样东西。',
      ],
      [
        '探险队在亚马逊丛林里遇到一条湍急的河流。',
        '独木舟太小了，每次只能载两个人。但有些队员之间互相忌惮……',
      ],
      [
        '三对夫妇在夜幕降临时来到渡口。',
        '船很小，每次最多载两人。而且——丈夫们的嫉妒心比夜色更浓。',
      ],
    ],
    bridges: ['船每次只能载有限的人/物。如果守规则的人不在场，会发生危险。'],
    endings: ['怎样安排才能让所有人安全到达对岸？'],
  },

  // ═══ 一笔画 ═══
  path_finding: {
    setups: [
      [
        '考古学家在遗迹中发现了古老的星图。',
        '星图上的星座需要一笔连成，不能重复经过同一颗星。',
      ],
      [
        '宫殿花园的迷宫设计图摊在桌上。',
        '皇家园林师要求：必须经过每一处喷泉，但路径不能重复。',
      ],
      [
        '圣诞树上挂着串灯，孩子们要让电流点亮每一盏灯——但线不能交叠。',
      ],
    ],
    bridges: ['已有部分连线给出，剩下的需要你来完成。'],
    endings: ['你能一笔走完所有节点吗？'],
  },

  // ═══ 数字网格 ═══
  number_grid: {
    setups: [
      [
        '图书馆的古籍里夹着一页奇怪的数字网格。',
        '一些格子是空的，格子之间标注了大小关系符号。',
      ],
      [
        '甜品大赛上，评委给六块蛋糕打分。',
        '分数卡被撕碎了，只留下部分数字和比较箭头。',
      ],
    ],
    bridges: ['每行每列的数字必须各不相同。大小关系符号指示了相邻格子的数值大小。'],
    endings: ['请填满所有的空格。'],
  },

  // ═══ 拼图/七巧板 ═══
  jigsaw: {
    setups: [
      [
        '工艺大师留下了一块奇形怪状的木板和几片切割好的碎片。',
        '"将这些碎片拼成那块木板的形状"，这是学徒最后的考验。',
      ],
      [
        '美术教室里，老师把一张画剪成了几片。',
        '"重新组合起来——但注意，原来的画是一艘帆船。"',
      ],
      [
        '祖母的旧盒子里有一套七巧板。',
        '她笑着拿出一张轮廓图："用这些碎片，拼出这只天鹅。"',
      ],
    ],
    bridges: ['碎片可以旋转和翻转。'],
    endings: ['请将所有碎片拼成目标形状，不留空隙。'],
  },

  // ═══ 侧向思维 ═══
  lateral_thinking: {
    setups: [
      [
        '教授在休息室里喝下午茶时，突然问了一个奇怪的问题。',
      ],
      [
        '侦探合上卷宗，微笑着说了句谜一样的话。',
      ],
      [
        '老水手讲了个没头没尾的故事——但答案就藏在细节里。',
      ],
    ],
    bridges: ['仔细想，答案可能不是你直觉的那样。'],
    endings: ['你知道为什么吗？'],
  },

  // ═══ 文字游戏 ═══
  word_play: {
    setups: [
      [
        '午后的图书馆里，管理员在公告板上贴了一道文字谜题。',
      ],
      [
        '街边的老诗人随手在石板地上写了几行字，路人们都停下来琢磨。',
      ],
    ],
    bridges: ['文字里藏着一个巧妙的机关。'],
    endings: ['你发现规律了吗？', '谜底是什么？'],
  },

  // ═══ 测量 ═══
  measurement: {
    setups: [
      [
        '厨房里只有两个水壶——容量不同，没有刻度。',
        '但食谱上写着需要精确的水量。',
      ],
      [
        '实验室里有两个沙漏，一个流完是 4 分钟，另一个是 7 分钟。',
        '实验要求精确计时——但墙上没有钟。',
      ],
    ],
    bridges: ['你只有这些工具，需要精确量出目标数量。'],
    endings: ['怎么操作？'],
  },
};

// ─── 类别到模板的映射 ───────────────────────────────────────

const TYPE_TO_TEMPLATE: Record<string, string> = {
  [PuzzleType.SLIDING_BLOCK]: 'sliding_block',
  [PuzzleType.LOGIC_GRID]: 'logic_grid',
  [PuzzleType.MATH]: 'math',
  [PuzzleType.MATCHSTICK]: 'matchstick',
  [PuzzleType.WEIGHING]: 'weighing',
  [PuzzleType.RIVER_CROSSING]: 'river_crossing',
  [PuzzleType.PATH_FINDING]: 'path_finding',
  [PuzzleType.NUMBER_GRID]: 'number_grid',
  [PuzzleType.JIGSAW]: 'jigsaw',
  [PuzzleType.LATERAL_THINKING]: 'lateral_thinking',
  [PuzzleType.WORD_PLAY]: 'word_play',
  [PuzzleType.MEASUREMENT]: 'measurement',
};

// ─── 生成器 ──────────────────────────────────────────────────

export class StoryGenerator {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  /**
   * 生成谜题的故事上下文。
   * @param type 谜题类型
   * @param title 谜题标题（用于组合）
   * @param customScenario 可选的自定义情境（引擎自己提供的，优先使用）
   * @param customQuestion 可选的自定义问题正文（引擎自己提供的）
   */
  generate(
    type: PuzzleType,
    title: string,
    customScenario?: string,
    customQuestion?: string
  ): StoryContext {
    const templateKey = TYPE_TO_TEMPLATE[type];
    const tmpl = TEMPLATES[templateKey];

    if (!tmpl) {
      // Fallback: generic
      return {
        title,
        scenario: customScenario ?? '教授合上笔记本，递来一道谜题。',
        question: customQuestion ?? '请仔细思考并作答。',
      };
    }

    // Pick a random setup group
    const setupGroup = this.rng.pick(tmpl.setups);
    const setup = setupGroup.join(' ');

    const bridge = this.rng.pick(tmpl.bridges);
    const ending = this.rng.pick(tmpl.endings);

    // If engine provides its own scenario, use it; otherwise generate
    const scenario = customScenario ?? setup;

    // If engine provides its own question, use it; otherwise combine
    const question = customQuestion ?? `${bridge} ${ending}`;

    return {
      title: title || `谜题 · ${type}`,
      scenario,
      question,
    };
  }
}
