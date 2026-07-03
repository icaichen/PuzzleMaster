/**
 * WeighingEngine.ts — 天平称重谜题引擎
 *
 * 经典假币问题：N 枚硬币中有一枚假币（重量不同），
 * 用天平称 M 次找出假币并判断它是更轻还是更重。
 *
 * 理论最大：M 次称重最多能处理 (3^M - 3) / 2 枚硬币。
 */
import { PuzzleType } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
const CONFIGS = [
    { coins: 3, weighings: 2, difficulty: 1, scenario: '桌上放着 3 枚外观完全相同的金币，其中 1 枚是假的——它比真币更轻。' },
    { coins: 5, weighings: 2, difficulty: 2, scenario: '你有 5 枚金币，其中 1 枚是假的——它比真币更轻。' },
    { coins: 8, weighings: 2, difficulty: 3, scenario: '8 枚银币中混入了 1 枚假币，假币比真币稍重。' },
    { coins: 9, weighings: 2, difficulty: 4, scenario: '考古发现 9 枚古币，其中 1 枚是赝品——重量与真品不同，但不知道更轻还是更重。' },
    { coins: 12, weighings: 3, difficulty: 7, scenario: '12 枚金币中有一枚是假的，重量与真币不同（可能更轻也可能更重）。' },
];
export class WeighingEngine {
    constructor() {
        this.type = PuzzleType.WEIGHING;
        this.isBank = false;
        this.rng = new SeededRandom(0);
    }
    generate(difficulty, seed) {
        const actualSeed = seed ?? SeededRandom.randomSeed();
        this.rng = new SeededRandom(actualSeed);
        // Pick config matching difficulty
        const candidates = CONFIGS.filter(c => c.difficulty <= difficulty + 1);
        if (candidates.length === 0)
            return null;
        const config = this.rng.pick(candidates);
        // Pick which coin is fake and whether heavier or lighter
        const fakeCoinIndex = this.rng.nextInt(1, config.coins);
        const isHeavier = this.rng.next() > 0.5;
        const weightDesc = isHeavier ? '更重' : '更轻';
        const answer = `第 ${fakeCoinIndex} 枚金币是假的，它比真币${weightDesc}。`;
        const question = `${config.scenario} 你有一个天平（无砝码），最多只能称 ${config.weighings} 次。请问哪一枚是假币？它是更轻还是更重？`;
        // Generate strategy hint
        const firstWeigh = Math.floor(config.coins / 3);
        const strategyHint = config.coins >= 12
            ? `第一次称：将 12 枚分成三组 A(1-4)、B(5-8)、C(9-12)。称 A vs B。如果平衡，假币在 C 组；如果倾斜，假币在较轻/较重的一侧。`
            : `第一次称：将金币分成三组。称其中两组。`;
        return {
            id: `weighing_${actualSeed}`,
            type: PuzzleType.WEIGHING,
            difficulty: config.difficulty,
            title: `天平称重 · ${config.coins} 枚硬币`,
            description: config.scenario,
            initial_state: {
                question,
                coins: config.coins,
                weighings: config.weighings,
                fakeIndex: fakeCoinIndex,
                isHeavier,
            },
            goal_state: { answer },
            hints: [
                `提示一：每次称量都有三种结果：左边重、右边重、平衡。${config.weighings} 次称量最多能区分 ${Math.pow(3, config.weighings)} 种情况。`,
                `提示二：${strategyHint}`,
                `提示三：${answer}`,
            ],
            seed: actualSeed,
        };
    }
}
//# sourceMappingURL=WeighingEngine.js.map