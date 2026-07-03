/**
 * SeededRandom.ts — 确定性随机数生成器
 *
 * 基于 mulberry32 算法，同一 seed 保证同一序列。
 * 用于每日挑战、关卡复现、测试确定性。
 */
export class SeededRandom {
    constructor(seed) {
        this.state = seed >>> 0;
    }
    /** 返回 [0, 1) 的浮点数，等价于 Math.random() */
    next() {
        this.state = (this.state + 0x6D2B79F5) >>> 0;
        let t = this.state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    /** 返回 [min, max] 的整数（含两端） */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    /** 从数组中随机取一个元素 */
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }
    /** Fisher-Yates 洗牌，返回新数组 */
    shuffle(arr) {
        const result = [...arr];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    /** 生成一个随机 seed（用于无 seed 调用时自动生成） */
    static randomSeed() {
        return Math.floor(Math.random() * 2147483647);
    }
}
//# sourceMappingURL=SeededRandom.js.map