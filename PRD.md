# 产品需求文档 (PRD): Project Enigma (类雷顿纯解谜游戏)

## 1. 项目概述 (Project Overview)

- **核心定位**：一款主打纯逻辑与空间解谜的游戏，砍掉剧情探索，聚焦解谜核心体验（类似《雷顿教授》的解谜环节）。
- **核心驱动力**：通过程序化内容生成（PCG）实现无限关卡，通过微信社交裂变与每日挑战驱动长线留存。
- **目标平台**：微信小游戏（首发/重运营） + 原生 App（iOS/Android，重沉浸感）。
- **技术栈建议**：
  - 前端引擎：Cocos Creator (TypeScript) 或 Phaser.js（完美兼容微信小游戏环境与跨平台 App 导出）。
  - 数据格式：完全数据驱动，所有谜题解析基于标准化的 JSON Schema。

## 2. 系统架构与数据流 (Architecture & Data Flow)

必须严格遵循 **MVC（模型-视图-控制器）** 架构。解谜逻辑（核心算法）与 UI 渲染必须完全解耦，以便于一套题库代码在微信和 App 双端复用。

### 2.1 标准化谜题数据结构 (Puzzle JSON Schema)

所有算法生成的谜题，最终必须输出为以下 TypeScript 接口标准：

```typescript
interface PuzzleData {
  id: string;                  // 唯一谜题ID (如 "klotski_001")
  type: PuzzleType;            // 谜题分类 (如 "SPATIAL_KLOTSKI", "MATH_TEMPLATE")
  difficulty: number;          // 难度系数 (1-10)
  title: string;               // 谜题标题 (如 "逃脱的方块")
  description: string;         // 题面描述
  initial_state: any;          // 初始状态数据 (根据 type 不同而变化)
  goal_state: any;             // 目标/胜利条件
  hints: string[];             // 提示数组 [提示1, 提示2, 终极提示]
  seed: number;                // 随机种子(用于每日挑战同源生成)
}
```

## 3. 核心机制：谜题生成引擎 (PCG Engine)

Coding Agent 需要重点开发以下三个子模块，取代人工关卡设计。

### 模块 A：逆向推演引擎 (Reverse Search Engine)

- **适用类型**：华容道、接水管、推箱子、一笔画。
- **生成算法（以华容道为例）**：
  1. **定义终点**：在 N × M 矩阵中，设定目标方块已处于出口位置。
  2. **随机回退 (Random Walk)**：根据物理碰撞规则，让系统随机合法地"倒退"移动方块。
  3. **步数控制难度**：随机回退 10 步为简单，30 步为困难。记录最后的盘面为 `initial_state`。
  4. **A\* 验证 (A-Star Validation)**：使用 A\* 算法从 `initial_state` 正向寻路，若最优解步数低于设定阈值（如发现捷径），则废弃该盘面重新生成。

### 模块 B：约束满足求解器 (CSP Engine)

- **适用类型**：逻辑推理（真假话判定、颜色/位置匹配）。
- **生成算法**：
  1. 定义实体库 Entities（如 A, B, C）和属性库 Attributes（如 杀手, 平民, 警察）。
  2. 随机生成一个真理表 (Ground Truth)。
  3. 程序随机挑选 N 条规则描述（例如 `A != 杀手`, `B == 平民`）。
  4. 将规则输入逻辑校验器，若规则推导出的结果唯一且等于真理表，则生成成功；若存在多种解，则补充规则。

### 模块 C：语义模板渲染器 (Template Engine)

- **适用类型**：数学计算、文字逻辑。
- **生成算法**：
  1. 读取带变量的 JSON 文本模板。例如：`"共有 ${x} 个头，${y} 条腿，求鸡的数量。"`
  2. 根据难度范围随机生成解 Answer（如鸡 5 只，兔 3 只）。
  3. 反向计算出变量 `x=8`, `y=22`。
  4. 将变量注入模板生成 `description`。

## 4. 平台特性与游戏循环 (Platform Specifics)

### 4.1 微信小游戏专属设计 (WeChat Mini-Game)

- **UI 交互**：无尽流模式 (Endless Flow)。类似刷短视频，完成一关后出现华丽的粒子特效，直接向下滑动平滑过渡到下一题，不弹全屏结算菜单。
- **每日挑战 (Daily Challenge)**：使用 `Math.seedrandom(今日日期 YYYYMMDD)` 保证全服玩家今天生成的 3 道题（易、中、难）完全一致。完成挑战获得日历图章。
- **社交裂变 (Social Viral)**：
  - **求助机制**：卡关时点击"求助群友"，调用微信 API 生成分享卡片。卡片携带该题的 `seed` 和 `initial_state`。
  - 群友点击卡片直接进入该关卡，无需注册/新手教程。
  - 解开后，双方各奖励 3 枚"提示金币"。

### 4.2 原生 App 专属设计 (Native App)

- **UI 交互**：大地图路线 (Saga Map)。采用节点式地图（类似《糖果传奇》），强化目标感。
- **离线模式**：首次启动或连接 Wi-Fi 时，通过后台静默生成并缓存 100 道题目到本地 SQLite / LocalStorage。
- **沉浸感体验**：加入丰富的 Haptics（触觉震动反馈）和拟物化的音效（纸张摩擦、木块碰撞）。

## 5. 经济与提示系统 (Economy & Hint System)

解谜游戏极易造成玩家挫败感，需要完善的提示系统作为缓冲。

- **货币**：提示金币 (Hint Coins)。
- **获取途径**：通关（+1），微信分享（+2），看激励视频广告（+3，微信端），IAP 内购（App 端）。
- **消耗与分层提示**：
  - **Hint 1（耗费 1 币）**：文字点拨（"注意最左边的红色方块..."）。
  - **Hint 2（耗费 2 币）**：视觉高亮（在画面上标出关键可交互物品或第一步操作）。
  - **Super Hint（耗费 5 币）**：直接演示前 30% 的正确步骤（适用于空间移动题）或给出核心公式。

## 6. 给 Coding Agent 的开发阶段拆解 (Execution Roadmap)

> **Agent Instruction**: Please execute the development in the following strict phases. Do not move to the next phase until the current one is fully functional.

### Phase 1: 核心引擎与 MVP (Minimum Viable Puzzle)

- **任务**：忽略所有 UI 和平台特性，只建立核心的解谜引擎。
- **行动**：
  - 创建标准的 `PuzzleData` 接口。
  - 实现"华容道 (Klotski)"的 Reverse Search Engine。
  - 使用 Canvas/HTML5 绘制一个极简的黑白测试界面，确保：能够生成题目 → 玩家可以通过鼠标/触摸移动方块 → 系统能正确判定胜利。

### Phase 2: 模板扩展与架构解耦

- **任务**：引入更多题型，完善数据流架构。
- **行动**：
  - 实现"数学/文字模板引擎 (Template Engine)"，在界面上渲染文本输入框判定答案。
  - 确保逻辑层 (Logic Controller) 和渲染层 (View) 完全解耦。任何题型的生成结果都只是一段 JSON。

### Phase 3: Meta-Game 循环与状态管理

- **任务**：建立金币、提示系统和本地存档。
- **行动**：
  - 实现全局的 `GameStateManager`，记录玩家的金币数量、当前关卡、已使用的提示。
  - 实现提示系统的 UI 弹窗和扣币逻辑。

### Phase 4: 微信小游戏特定功能 (WeChat specific)

- **任务**：接入微信社交生态。
- **行动**：
  - 基于当天日期建立伪随机数生成器 (Seeded RNG)，构建"每日挑战"模式。
  - 编写"一键分享"逻辑，将当前关卡的 JSON 数据序列化后挂载在分享卡片的 URL 参数或微信 Payload 中。
