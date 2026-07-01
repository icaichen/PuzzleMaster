import fs from 'fs';
import path from 'path';
import { PuzzleData, PuzzleType, AssetManifest } from '../src/models/PuzzleData.js';

/**
 * 资产生成全自动管线 (The "Director" Pipeline)
 * 
 * 步骤:
 * 1. 提取机制数据 (Mechanism Data)
 * 2. 导演引擎分配角色 (Director Engine -> Scene & Pieces)
 * 3. 美术引擎生成切图 (Art Engine -> Image API)
 * 4. 自动化抠图处理 (Post-Processor)
 * 5. 组装 AssetManifest 并导出
 */

// === 模拟环境 ===
// 实际生产中这里将调用大模型 API (DeepSeek/GPT-4o) 和生图 API (Midjourney/DALL-E)
const ASSET_DIR = path.join(process.cwd(), 'public', 'assets', 'generated');

if (!fs.existsSync(ASSET_DIR)) {
  fs.mkdirSync(ASSET_DIR, { recursive: true });
}

// 模拟: 生成一张纯色图片作为假背景/道具
function createMockImage(filename: string, color: string, w: number, h: number) {
  const p = path.join(ASSET_DIR, filename);
  // 在实际项目中，这会被真实生成的 png 替换。这里我们用一个极简的 base64 PNG 模拟。
  // 为了演示管线，我们直接输出包含占位符图像信息的 txt 或简单 svg。
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" fill="white" font-family="sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">${filename}</text></svg>`;
  fs.writeFileSync(p.replace('.png', '.svg').replace('.jpg', '.svg'), svg);
  return `/assets/generated/${filename.replace('.png', '.svg').replace('.jpg', '.svg')}`;
}

export async function runPipeline(puzzle: PuzzleData): Promise<PuzzleData> {
  console.log(`[Pipeline] 🚀 开始处理谜题: [${puzzle.type}] ${puzzle.id}`);

  // 1. 导演分配角色 (Director)
  console.log(`[Pipeline] 🎬 导演正在思考场景与角色...`);
  // (Stub: 假设大模型返回了以下分配)
  let bgUrl = '';
  const sprites: any[] = [];

  if (puzzle.type === PuzzleType.SLIDING_BLOCK) {
    // 假设是华容道
    console.log(`[Pipeline] 🎨 决定主题: "逃离海盗船"`);
    puzzle.scene_theme = "逃离海盗船";
    puzzle.narrative_setup = "水手被海盗桶围住了，帮他挪开木桶逃出甲板！";
    
    // 生成背景
    bgUrl = createMockImage(`bg_${puzzle.id}.jpg`, '#1a4a6b', 800, 600);
    
    // 生成目标人物和障碍物
    sprites.push({
      id: 'sailor',
      url: createMockImage(`sailor_${puzzle.id}.png`, '#f1c40f', 160, 160)
    });
    sprites.push({
      id: 'barrel_v',
      url: createMockImage(`barrel_v_${puzzle.id}.png`, '#8e44ad', 80, 160)
    });
    sprites.push({
      id: 'barrel_h',
      url: createMockImage(`barrel_h_${puzzle.id}.png`, '#2ecc71', 160, 80)
    });
    sprites.push({
      id: 'crate_small',
      url: createMockImage(`crate_small_${puzzle.id}.png`, '#e67e22', 80, 80)
    });

    // 绑定 visual_elements
    puzzle.visual_elements = [
      { type: 'character', id: 'sailor', position: 'target_block', state: 'normal' },
      { type: 'prop', id: 'barrel_v', position: 'vertical_blocks', state: 'normal' },
      { type: 'prop', id: 'barrel_h', position: 'horizontal_blocks', state: 'normal' },
      { type: 'prop', id: 'crate_small', position: 'small_blocks', state: 'normal' }
    ];

  } else {
    // 默认兜底
    bgUrl = createMockImage(`bg_${puzzle.id}.jpg`, '#34495e', 800, 600);
    sprites.push({
      id: 'default_piece',
      url: createMockImage(`piece_${puzzle.id}.png`, '#e74c3c', 100, 100)
    });
  }

  console.log(`[Pipeline] 📸 AI 美术外包正在生成素材... (Mocked)`);
  // 模拟 API 耗时
  await new Promise(r => setTimeout(r, 1000));

  console.log(`[Pipeline] ✂️ 后期抠图与压缩完成...`);

  // 组装 AssetManifest
  const manifest: AssetManifest = {
    background_url: bgUrl,
    sprites: sprites
  };

  puzzle.assets = manifest;
  console.log(`[Pipeline] ✅ 资产打包完毕! 产出: ${manifest.sprites.length} 个切图`);

  return puzzle;
}

// === 测试运行 ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const dummyPuzzle: PuzzleData = {
    id: 'demo_pipeline_01',
    type: PuzzleType.SLIDING_BLOCK,
    difficulty: 3,
    title: '逃离海盗船',
    description: '华容道测试',
    initial_state: {},
    goal_state: {},
    hints: [],
    seed: 42
  };

  runPipeline(dummyPuzzle).then(result => {
    console.log(JSON.stringify(result.assets, null, 2));
  });
}
