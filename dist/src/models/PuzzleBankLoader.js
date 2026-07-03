/**
 * PuzzleBankLoader.ts — 从题库 JSON 加载谜题并转为 PuzzleData
 *
 * 用法:
 *   const loader = new PuzzleBankLoader();
 *   const puzzle = loader.getRandomPuzzle('lateral_thinking', 3);
 *   // → PuzzleData 对象，可直接传入 GameManager.loadPuzzle()
 */
import { PuzzleType } from './PuzzleData';
import { SeededRandom } from './SeededRandom';
// Vite 原生支持 JSON 导入
import bankFile from '../../data/puzzleBank.json';
/** category string → PuzzleType */
const CATEGORY_TYPE_MAP = {
    lateral_thinking: PuzzleType.LATERAL_THINKING,
    logic_deduction: PuzzleType.LATERAL_THINKING,
    math_puzzle: PuzzleType.MATH,
    word_play: PuzzleType.WORD_PLAY,
    common_sense: PuzzleType.LATERAL_THINKING,
    measurement: PuzzleType.MEASUREMENT,
};
export class PuzzleBankLoader {
    constructor() {
        this.bank = bankFile.puzzles || [];
        this.usedIds = new Set();
    }
    /** 获取题库总数 */
    get total() {
        return this.bank.length;
    }
    /** 获取所有类别 */
    get categories() {
        return [...new Set(this.bank.map((p) => p.category))];
    }
    /** 按类别字符串筛选（向后兼容） */
    filter(category, difficulty, exactDifficulty = false) {
        return this.bank.filter((p) => {
            if (category && p.category !== category)
                return false;
            if (difficulty !== undefined) {
                if (exactDifficulty ? p.difficulty !== difficulty : p.difficulty > difficulty)
                    return false;
            }
            if (this.usedIds.has(p.id))
                return false;
            return true;
        });
    }
    /** 按 PuzzleType 筛选（将多个 category 映射到同一 type） */
    filterByType(type, maxDifficulty) {
        // 收集该 type 对应的所有 category 名称
        const categories = Object.entries(CATEGORY_TYPE_MAP)
            .filter(([, t]) => t === type)
            .map(([cat]) => cat);
        return this.bank.filter((p) => {
            if (!categories.includes(p.category))
                return false;
            if (maxDifficulty !== undefined && p.difficulty > maxDifficulty)
                return false;
            if (this.usedIds.has(p.id))
                return false;
            return true;
        });
    }
    /** 随机取一道题（按 PuzzleType） */
    getRandomPuzzle(puzzleType, maxDifficulty, seed) {
        let candidates;
        if (puzzleType) {
            candidates = this.filterByType(puzzleType, maxDifficulty);
        }
        else {
            // Fallback: use old string-based filter
            candidates = this.filter(undefined, maxDifficulty);
        }
        if (candidates.length === 0) {
            this.usedIds.clear();
            const retry = puzzleType
                ? this.filterByType(puzzleType, maxDifficulty)
                : this.filter(undefined, maxDifficulty);
            if (retry.length === 0)
                return null;
            return this.toPuzzleData(retry[0]);
        }
        const rng = new SeededRandom(seed ?? Date.now());
        const picked = candidates[Math.floor(rng.next() * candidates.length)];
        this.usedIds.add(picked.id);
        return this.toPuzzleData(picked);
    }
    /** 按ID取题 */
    getById(id) {
        const puzzle = this.bank.find((p) => p.id === id);
        if (!puzzle)
            return null;
        return this.toPuzzleData(puzzle);
    }
    /** 取一批题（用于关卡包） */
    getPuzzlePack(count, category, maxDifficulty, seed) {
        const rng = new SeededRandom(seed ?? Date.now());
        const candidates = this.filter(category, maxDifficulty);
        // Fisher-Yates shuffle
        const shuffled = [...candidates];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, Math.min(count, shuffled.length)).map((p) => {
            this.usedIds.add(p.id);
            return this.toPuzzleData(p);
        });
    }
    /** 标记一道题为已使用 */
    markUsed(id) {
        this.usedIds.add(id);
    }
    /** 重置使用记录 */
    resetUsage() {
        this.usedIds.clear();
    }
    /** BankPuzzle → PuzzleData */
    toPuzzleData(bank) {
        const puzzleType = CATEGORY_TYPE_MAP[bank.category] ?? PuzzleType.LATERAL_THINKING;
        return {
            id: bank.id,
            type: puzzleType,
            difficulty: bank.difficulty,
            title: bank.title,
            description: bank.scenario,
            initial_state: {
                question: bank.question,
                picarat: bank.picarat,
                category: bank.category,
                tags: bank.tags,
            },
            goal_state: { answer: bank.answer },
            hints: bank.hints,
            seed: 0,
        };
    }
}
//# sourceMappingURL=PuzzleBankLoader.js.map