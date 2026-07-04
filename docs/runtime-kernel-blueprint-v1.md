# PuzzleMaster 运行时能力内核蓝图 v1

状态：`DERIVED_FROM_165_RULE_AUDIT`

## 三个层级

- **165个参考题记录**：证明没有漏读目录中的题。
- **96个具体机制模式**：保留真实规则差异；系列续题归并。
- **30个运行时内核**：代码层复用的状态、动作和求解能力。

内核不是内容模板。两个机制可以共享内核，但拥有完全不同的状态字段、约束组合、交互和核心洞察。微信关卡生成器通常对应“具体机制模式”，不能直接从内核盲目随机生成。

## 内核清单

| 内核 | 覆盖题数 | 核心状态 | 典型动作 | 求解/验证策略 |
|---|---:|---|---|---|
| STATIC_REASONING | 8 | 题面参数、候选答案 | 输入或选择 | 公式、枚举或专属判定 |
| VISUAL_INSPECTION | 11 | 图像对象、遮挡、视角 | 观察、选择、旋转视图 | 标注真值与视觉资产校验 |
| CSP_ASSIGNMENT | 23 | 变量、域、约束 | 放置、选择、赋值 | 回溯、SAT/SMT、约束传播 |
| INFORMATION_DEDUCTION | 1 | 隐藏状态、查询历史 | 查询、称量、提交 | 决策树与信息增益 |
| RULE_DISCOVERY | 2 | 样例、隐藏规则候选 | 试验、选择 | 候选规则消歧 |
| SEQUENCE_REASONING | 1 | 有序样例、空位 | 选择、排列 | 序列约束 |
| SEQUENCE_SIMULATION | 1 | 实体状态、触发顺序 | 触发一个对象 | 离散事件模拟 |
| PROGRAM_EXECUTION | 5 | 指令映射、方向、程序计数器 | 映射符号、执行 | 解释器与路径检查 |
| RESOURCE_ROUTE | 6 | 图位置、资源库存、已访问集合 | 移动、收集 | 扩展状态图搜索 |
| GRAPH_ROUTE | 1 | 节点、边、访问历史 | 沿边移动 | 图搜索与边约束 |
| GRAPH_DEDUCTION | 2 | 图结构、路径属性 | 选择节点或边 | 全路线枚举、必经性分析 |
| DYNAMIC_GRID_ROUTE | 10 | 网格、位置、可变地形 | 移动、等待 | 状态化BFS/A* |
| MULTI_AGENT_ROUTE | 2 | 多角色位置、共享动作 | 同步移动 | 联合状态搜索 |
| TIME_EXPANDED_ROUTE | 7 | 时间相位、移动实体、当前位置 | 等待、移动、换乘 | 周期时间展开图 |
| MEASUREMENT_TRANSFER | 2 | 容器容量与当前量 | 装满、倒空、转移 | BFS与不变量分析 |
| TOKEN_TRANSITION | 6 | 棋子位置、类型 | 跳跃、移除、翻转 | 状态图搜索 |
| REARRANGEMENT | 13 | 有序容器、空位、容量 | 移动组、交换、调度 | BFS/A*、置换距离 |
| SLIDING_PHYSICS | 5 | 物体几何、碰撞、空位 | 滑动、推动 | 碰撞模拟与搜索 |
| GRID_TRANSFORM | 5 | 网格内容与局部变换 | 行列平移、局部旋转 | 置换搜索 |
| ROTATION_CONSTRAINT | 2 | 可旋转组件、区域聚合值 | 旋转组件 | 枚举与约束传播 |
| TOGGLE_NETWORK | 3 | 二元/多元单元与影响掩模 | 点击位置或掩模 | 线性代数或BFS |
| BEAM_REFLECTION | 3 | 发射点、方向、反射板状态 | 发射、选择入口 | 射线追踪与状态模拟 |
| GRID_PLACEMENT | 16 | 棋盘、部件占用、局部属性 | 放置、旋转 | 精确覆盖与CSP |
| GEOMETRIC_PLACEMENT | 6 | 连续几何、障碍、射线 | 拖动、旋转 | 碰撞、相交与覆盖检测 |
| PIECE_ASSEMBLY | 6 | 自由拼片、边界、目标轮廓 | 移动、旋转 | 几何匹配与搜索 |
| PACKING_GEOMETRY | 2 | 容器、多边形、重叠关系 | 拖动、旋转 | 碰撞检测与装填验证 |
| LAYER_COMPOSITING | 3 | 图层顺序、透明像素 | 放置图层、调层级 | 合成结果与排列搜索 |
| LINE_REGION_GEOMETRY | 4 | 点、线、面、内外对象 | 连线、闭环、切割 | 平面图、相交和点包含 |
| EXACT_COVER_PARTITION | 7 | 基元集合、候选分组 | 选择分组或切割 | Algorithm X、集合划分 |
| SPATIAL_TRANSFORM | 2 | 面、朝向、折叠邻接 | 折叠、选择面 | 刚体变换与拓扑映射 |

## 系统组合方式

一道题的主要机制映射到一个内核，必要时组合次要服务：

```text
Puzzle Definition
  ├─ Primary Kernel
  ├─ Optional Constraint Modules
  ├─ Interaction Contract
  ├─ Validator
  ├─ Solver
  └─ Optional Generator
```

例如“不同速度载具换乘”使用 `TIME_EXPANDED_ROUTE`；载具运动由周期轨迹模块提供，换乘条件由邻接模块提供。它不需要新增一套页面系统，但需要独立的机制定义和生成器。

## 防漏设计

1. 所有谜题实例必须声明主要内核和机制模式。
2. 机制模式必须登记状态变量、动作、转移、目标和求解策略。
3. 未登记机制不能进入题库。
4. 专属题可以使用 `BESPOKE` 机制，但仍必须实现统一运行协议。
5. 覆盖检查在自动验证中执行：165题必须全部出现且只出现一次。
6. 蓝图允许扩展；“可扩展”不是遗漏参考机制的借口。

