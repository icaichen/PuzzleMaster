import { PuzzleType } from '../models/PuzzleData';
/**
 * Layer 2: LLMEngine (Narrative & Visual Story Renderer)
 *
 * 这是一个中间件，负责接收 Layer 1 (机制引擎) 输出的纯抽象机制数据，
 * 通过向大模型 (这里为高智商 Mock) 请求，生成雷顿式的叙事情境、视觉元素映射和整合提示，
 * 最终输出三层融合的终极 PuzzleData。
 */
export class LLMEngine {
    /**
     * 为机制谜题注入灵魂 (Layer 2 渲染)
     */
    async enrichPuzzle(mechanismPuzzle) {
        // 在真实环境中，这里会拼装 prompt 并 fetch 大模型 API
        // const prompt = `你是雷顿教授风格的谜题设计师。给定机制类型 ${mechanismPuzzle.type} ...`;
        // const response = await fetchLLM(prompt);
        // return this.merge(mechanismPuzzle, response);
        // 模拟 LLM API 的网络延迟
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.mockLLMResponse(mechanismPuzzle);
    }
    mockLLMResponse(puzzle) {
        const enriched = { ...puzzle };
        // 根据谜题类型赋予特定的雷顿风情境
        switch (puzzle.type) {
            case PuzzleType.SLIDING_BLOCK: // 华容道
                enriched.scene_theme = "古堡密室";
                enriched.title = "被困的骑士";
                enriched.narrative_setup = "雷顿教授在古堡深处发现了一扇被巨大石板挡住的暗门。'看来我们要帮这位红甲骑士找到出口，卢克！'";
                enriched.visual_elements = [
                    { type: 'character', id: 'red_knight', position: 'target_block', state: 'trapped' },
                    { type: 'prop', id: 'stone_pillar', position: 'vertical_blocks', state: 'heavy' },
                    { type: 'prop', id: 'rubble', position: 'small_blocks', state: 'scattered' },
                    { type: 'background', id: 'dungeon_door', position: 'exit', state: 'locked' }
                ];
                enriched.integrated_hints = [
                    "骑士的盔甲太重，必须先移开挡在前面的高大石柱。",
                    "注意地上的碎石块，把它们推到角落也许能腾出空间。"
                ];
                break;
            case PuzzleType.LOGIC_GRID: // 逻辑网格
                enriched.scene_theme = "列车迷案";
                enriched.title = "特快列车上的乘客";
                enriched.narrative_setup = "开往伦敦的特快列车上发生了一起小小的失窃案。教授仔细倾听着四位嫌疑人漫不经心的对话，试图找出规律。";
                enriched.visual_elements = [
                    { type: 'character', id: 'suspects', position: 'category_1', state: 'sitting' },
                    { type: 'prop', id: 'luggage', position: 'category_2', state: 'closed' },
                    { type: 'prop', id: 'tickets', position: 'category_3', state: 'stamped' },
                    { type: 'background', id: 'train_cabin', position: 'background', state: 'moving' }
                ];
                enriched.integrated_hints = [
                    "对话中提到‘靠窗’的人，也许和那个带着红色手提箱的人不是同一位。",
                    "试着把所有不在同一车厢的线索先排除掉。"
                ];
                // 替换冰冷的机制描述
                if (enriched.description.includes("逻辑网格")) {
                    enriched.description = "根据乘客们的供述，还原所有人的对应关系。";
                }
                break;
            case PuzzleType.NUMBER_GRID: // 数字网格
                enriched.scene_theme = "炼金实验室";
                enriched.title = "不稳定的药剂";
                enriched.narrative_setup = "炼金术士留下了六瓶颜色各异的药剂，架子上的标签写着复杂的配比符号。'如果我们放错顺序，实验室可能就要被炸飞了。'";
                enriched.visual_elements = [
                    { type: 'prop', id: 'potion_flasks', position: 'grid_cells', state: 'bubbling' },
                    { type: 'prop', id: 'magic_runes', position: 'inequality_signs', state: 'glowing' },
                    { type: 'background', id: 'alchemy_shelf', position: 'board', state: 'dusty' }
                ];
                enriched.integrated_hints = [
                    "最大体积的药剂肯定放在了符文指向较大的一端。",
                    "不要忘记，同一排的架子上不能放相同容量的瓶子。"
                ];
                break;
            case PuzzleType.PATH_FINDING: // 一笔画
                enriched.scene_theme = "星空祭坛";
                enriched.title = "失落的星座";
                enriched.narrative_setup = "神庙穹顶上的星图暗淡无光。传说只要一气呵成地将星辰连接，神明的指引就会浮现。";
                enriched.visual_elements = [
                    { type: 'prop', id: 'stars', position: 'nodes', state: 'dim' },
                    { type: 'prop', id: 'stardust_trail', position: 'edges', state: 'invisible' },
                    { type: 'background', id: 'night_sky', position: 'canvas', state: 'clear' }
                ];
                enriched.integrated_hints = [
                    "那些只有奇数条连线相连的星辰，必定是起点或终点。",
                    "试着从角落最孤立的那颗星星开始连接。"
                ];
                break;
            default:
                enriched.scene_theme = "神秘委托";
                enriched.narrative_setup = "一封没有署名的信件被塞进了侦探事务所的门缝。信中只留下了这道耐人寻味的谜题。";
                enriched.visual_elements = [
                    { type: 'prop', id: 'envelope', position: 'top', state: 'sealed' },
                    { type: 'background', id: 'wooden_desk', position: 'background', state: 'cluttered' }
                ];
                enriched.integrated_hints = [
                    "仔细阅读信件的每一个字，也许能发现弦外之音。"
                ];
                break;
        }
        return enriched;
    }
}
//# sourceMappingURL=LLMEngine.js.map