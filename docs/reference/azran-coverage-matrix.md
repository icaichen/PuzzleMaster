# 《超文明A的遗产》165题机制覆盖矩阵

来源：[Professor Layton and the Azran Legacy puzzle index](https://layton.fandom.com/wiki/Professor Layton and the Azran Legacy/List of puzzles)  
用途：研究参考作品的机制广度，不复制题面、布局、图像或答案。  
覆盖：**165/165（100%）**  
具体机制模式：**96**  
运行时能力内核：**30**

> “Listed Type”是原目录的表层交互标签；“机制模式”和“运行时内核”是本项目根据详细规则提取的结构分类。

| # | 题名 | Listed Type | 机制ID | 机制模式 | 运行时内核 | 生成适配 |
|---:|---|---|---|---|---|---|
| 001 | Airship's Destination | Find Route | REF-001 | 有限燃料补给路径 | RESOURCE_ROUTE | PROCEDURAL |
| 002 | A Glacial Gift | Write Answer | REF-002 | 比例换算文字题 | STATIC_REASONING | PROCEDURAL |
| 003 | Lighten Up | Arrange | REF-003 | 覆盖且同色射线不相交 | GEOMETRIC_PLACEMENT | HYBRID |
| 004 | Similar Snowflakes | Multiple Choice | REF-004 | 旋转图形精确匹配排除 | VISUAL_INSPECTION | PROCEDURAL |
| 005 | Embroidery Enigma | Arrange | REF-005 | 二维路径图案序列补全 | SEQUENCE_REASONING | HYBRID |
| 006 | Frozen in Time | Divide | REF-006 | 旋转光束连通并等面积分区 | LINE_REGION_GEOMETRY | HYBRID |
| 007 | Mutiny! | Solitaire | REF-007 | 连续跳跃并翻转被跨越棋子 | TOKEN_TRANSITION | PROCEDURAL |
| 008 | Reggie's Slidy Ride | Slide | REF-008 | 碰撞滑行与落穴填充 | SLIDING_PHYSICS | PROCEDURAL |
| 009 | Dial Trial | Calculate | REF-009 | 旋转分区使各区符号和相等 | ROTATION_CONSTRAINT | PROCEDURAL |
| 010 | Funky Hooks | Sequence | REF-010 | 周期障碍下的时序移动 | TIME_EXPANDED_ROUTE | PROCEDURAL |
| 011 | A Laborious Litre | Calculate | REF-011 | 定容器皿量取目标体积 | MEASUREMENT_TRANSFER | PROCEDURAL |
| 012 | Squirrel Snacks | Calculate | REF-012 | 有限两两称量推断完整顺序 | INFORMATION_DEDUCTION | HYBRID |
| 013 | Pretty Paper Petals | Select | REF-013 | 接触图着色 | CSP_ASSIGNMENT | PROCEDURAL |
| 014 | Blooming Flowers | Arrange | REF-014 | 带颜色邻接约束的多格块铺装 | GRID_PLACEMENT | PROCEDURAL |
| 015 | Something Fishy | Slide | REF-015 | 整行整列平移复原图像 | GRID_TRANSFORM | PROCEDURAL |
| 016 | Give Me a Sign! | Arrange | REF-016 | 自由拼块还原目标轮廓 | PIECE_ASSEMBLY | HYBRID |
| 017 | Walking on Water | Find Route | REF-017 | 踩踏后持续滑行的移动平台路线 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 018 | The Celestial King | Draw Line | REF-018 | 有限直线最大分区并隔离目标 | LINE_REGION_GEOMETRY | HYBRID |
| 019 | A Dog of Tiles | Tile | REF-019 | 固定尺寸彩色图层叠加成图 | LAYER_COMPOSITING | PROCEDURAL |
| 020 | Boat to Boat | Find Route | REF-020 | 不同速度移动载具的定时换乘 | TIME_EXPANDED_ROUTE | PROCEDURAL |
| 021 | Fishing Friends | Multiple Choice | REF-021 | 邻接与否定条件人物归属 | STATIC_REASONING | PROCEDURAL |
| 022 | Hose Help? | Multiple Choice | REF-022 | 沿视觉路径寻找物理阻断点 | VISUAL_INSPECTION | HYBRID |
| 023 | Choc-Full | Divide | REF-023 | 相邻定长片段满足多组有序需求 | EXACT_COVER_PARTITION | PROCEDURAL |
| 024 | Mutual Meeting Place | Select | REF-024 | 公交网络陈述反推共同目标 | GRAPH_DEDUCTION | HYBRID |
| 025 | Cracking Combinations | Write Answer | REF-025 | 有限集合和的唯一缺口 | STATIC_REASONING | PROCEDURAL |
| 026 | Copy Cats | Find Route | REF-026 | 同步角色与条件自动移动 | MULTI_AGENT_ROUTE | PROCEDURAL |
| 027 | A Heart of Tiles | Tile | REF-019 | 固定尺寸彩色图层叠加成图 | LAYER_COMPOSITING | PROCEDURAL |
| 028 | Directing a Delivery | Arrange | REF-027 | 符号到指令的映射编程 | PROGRAM_EXECUTION | PROCEDURAL |
| 029 | Carriages of Justice | Select | REF-028 | 区间覆盖最少资源 | STATIC_REASONING | PROCEDURAL |
| 030 | Airship's Destination 2 | Find Route | REF-001 | 有限燃料补给路径 | RESOURCE_ROUTE | PROCEDURAL |
| 031 | For the Heart! | Select | REF-029 | 复杂纹样中的隐藏形状选择 | VISUAL_INSPECTION | HYBRID |
| 032 | Bibliofiling | Arrange | REF-030 | 行列计数约束下的多格块放置 | GRID_PLACEMENT | PROCEDURAL |
| 033 | Shopping Spree | Calculate | REF-031 | 无重复路线与精确消费总额 | RESOURCE_ROUTE | PROCEDURAL |
| 034 | The Future Awaits | Write Answer | REF-032 | 等速率区间换算 | STATIC_REASONING | PROCEDURAL |
| 035 | Fake Fragments | Select | REF-033 | 从候选碎片重建参考图 | PIECE_ASSEMBLY | HYBRID |
| 036 | Fuel's Errand | Arrange | REF-034 | 使用全部管件组成单一连通管道 | GRID_PLACEMENT | PROCEDURAL |
| 037 | Fuel's Errand 2 | Arrange | REF-034 | 使用全部管件组成单一连通管道 | GRID_PLACEMENT | PROCEDURAL |
| 038 | A Royal Burden | Write Answer | REF-035 | 旋转遮挡物的完整计数 | VISUAL_INSPECTION | HYBRID |
| 039 | Strawberry Sharer | Arrange | REF-036 | 多对象线性数量关系分配 | CSP_ASSIGNMENT | PROCEDURAL |
| 040 | Acorn Allocation | Select | REF-037 | 多角色依次收集不可再生资源 | RESOURCE_ROUTE | PROCEDURAL |
| 041 | Shunting into Sidings | Arrange | REF-038 | 机车调度与车厢顺序复原 | REARRANGEMENT | PROCEDURAL |
| 042 | A Boatload of Hassle | Divide | REF-039 | 环形相邻定长分组等和 | EXACT_COVER_PARTITION | PROCEDURAL |
| 043 | A String of Jewels | Rope | REF-040 | 经过全部锚点的单环内外分离 | LINE_REGION_GEOMETRY | HYBRID |
| 044 | Staged Silhouettes | Multiple Choice | REF-041 | 光源变化下的投影一致性 | VISUAL_INSPECTION | HYBRID |
| 045 | Piglet Racing | Arrange | REF-042 | 每次携带相邻一对的排列复原 | REARRANGEMENT | PROCEDURAL |
| 046 | Blooming Flowers 2 | Arrange | REF-014 | 带颜色邻接约束的多格块铺装 | GRID_PLACEMENT | PROCEDURAL |
| 047 | Fowl Food | Arrange | REF-043 | 二元日序列与多维出现次数 | CSP_ASSIGNMENT | PROCEDURAL |
| 048 | Acorn Allocation 2 | Select | REF-037 | 多角色依次收集不可再生资源 | RESOURCE_ROUTE | PROCEDURAL |
| 049 | Fussy Fruit Eaters | Arrange | REF-044 | 数量颜色与空间邻接联合分配 | CSP_ASSIGNMENT | PROCEDURAL |
| 050 | Forest Friends | Arrange | REF-045 | 不同步长对象的路径位置布置 | GRID_PLACEMENT | PROCEDURAL |
| 051 | Baby Boar Racing | Arrange | REF-042 | 每次携带相邻一对的排列复原 | REARRANGEMENT | PROCEDURAL |
| 052 | An Epic Quest | Slide | REF-046 | 可重排道路的分阶段路线 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 053 | The Domino Effect | Circle Answer | REF-047 | 方向敏感的连锁倒塌 | SEQUENCE_SIMULATION | HYBRID |
| 054 | A Trio of Trouble | Select | REF-048 | 遮挡场景中的多目标身份匹配 | VISUAL_INSPECTION | HYBRID |
| 055 | Very Specific Scoops | Arrange | REF-049 | 多条自然语言限制下的顺序选择 | CSP_ASSIGNMENT | PROCEDURAL |
| 056 | Give Me a Sign! 2 | Arrange | REF-016 | 自由拼块还原目标轮廓 | PIECE_ASSEMBLY | HYBRID |
| 057 | A Boatload of Trouble | Divide | REF-039 | 环形相邻定长分组等和 | EXACT_COVER_PARTITION | PROCEDURAL |
| 058 | Nose to Nose (AL) | Arrange | REF-050 | 有限传递距离和空位的标记重排 | REARRANGEMENT | PROCEDURAL |
| 059 | Lovely Pairs | Select | REF-051 | 两日异伴异地点配对 | CSP_ASSIGNMENT | PROCEDURAL |
| 060 | Boat to Boat 2 | Find Route | REF-020 | 不同速度移动载具的定时换乘 | TIME_EXPANDED_ROUTE | PROCEDURAL |
| 061 | Be My Guest | Write Answer | REF-052 | 流水账逆向恢复初始数量 | STATIC_REASONING | PROCEDURAL |
| 062 | Nose to Nose 2 | Arrange | REF-050 | 有限传递距离和空位的标记重排 | REARRANGEMENT | PROCEDURAL |
| 063 | Horsing Around | Multiple Choice | REF-053 | 多视角透视深度判断 | VISUAL_INSPECTION | HYBRID |
| 064 | Thick As Thieves | Arrange | REF-054 | 方形轮廓上的等权重布局 | GRID_PLACEMENT | PROCEDURAL |
| 065 | Cards on the Table | Select | REF-055 | 从输入输出样例推断隐藏映射 | RULE_DISCOVERY | PROCEDURAL |
| 066 | Flying the Coop | Select | REF-056 | 限定真话数量的责任推理 | CSP_ASSIGNMENT | PROCEDURAL |
| 067 | A Feathered Apple | Slide | REF-057 | 同组自由拼片变换目标轮廓 | PIECE_ASSEMBLY | HYBRID |
| 068 | Burger Building | Solitaire | REF-058 | 单跳移除棋子的中心收束 | TOKEN_TRANSITION | PROCEDURAL |
| 069 | Bibliofiling 2 | Arrange | REF-030 | 行列计数约束下的多格块放置 | GRID_PLACEMENT | PROCEDURAL |
| 070 | A Knightly Trial | Write Answer | REF-059 | 复合图形中的正方形计数 | VISUAL_INSPECTION | HYBRID |
| 071 | Burger Building 2 | Solitaire | REF-058 | 单跳移除棋子的中心收束 | TOKEN_TRANSITION | PROCEDURAL |
| 072 | Bemused Bunnies | Arrange | REF-060 | 重排道路面板连接成对端点 | GRID_PLACEMENT | PROCEDURAL |
| 073 | Counting Sheep | Write Answer | REF-061 | 多模余数条件恢复整数 | STATIC_REASONING | PROCEDURAL |
| 074 | Pampering Your Pets | Arrange | REF-062 | 带析取或假线索的唯一分配 | CSP_ASSIGNMENT | PROCEDURAL |
| 075 | Golden Butterfly | Select | REF-063 | 离散配比达到隐藏目标区间 | CSP_ASSIGNMENT | PROCEDURAL |
| 076 | Troubled Waters | Arrange | REF-064 | 障碍区域中的自由拼块桥接 | GEOMETRIC_PLACEMENT | HYBRID |
| 077 | Fruits and Fungi | Sequence | REF-065 | 交替采集序列与不可重复边路线 | GRAPH_ROUTE | PROCEDURAL |
| 078 | All Under Control | Select | REF-066 | 环形固定步长选择与状态翻转 | TOGGLE_NETWORK | PROCEDURAL |
| 079 | Snake Squeezing x10 | Arrange | REF-067 | 不重叠软形状容器装填 | PACKING_GEOMETRY | HYBRID |
| 080 | Golden Butterfly 2 | Select | REF-063 | 离散配比达到隐藏目标区间 | CSP_ASSIGNMENT | PROCEDURAL |
| 081 | Moonlight, Starlight | Select | REF-068 | 立体展开面的对应位置 | SPATIAL_TRANSFORM | PROCEDURAL |
| 082 | Walking on Water 2 | Find Route | REF-017 | 踩踏后持续滑行的移动平台路线 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 083 | Snake Squeezing x11 | Arrange | REF-067 | 不重叠软形状容器装填 | PACKING_GEOMETRY | HYBRID |
| 084 | Potion Placement | Arrange | REF-069 | 多源最短距离约束放置 | CSP_ASSIGNMENT | PROCEDURAL |
| 085 | The Phoenix Wakes | Arrange | REF-070 | 环上避免相邻连续数 | CSP_ASSIGNMENT | PROCEDURAL |
| 086 | Reggie's Slidy Ride 2 | Slide | REF-008 | 碰撞滑行与落穴填充 | SLIDING_PHYSICS | PROCEDURAL |
| 087 | A Shamefaced Clock | Write Answer | REF-071 | 分片等和恢复钟面朝向 | STATIC_REASONING | HYBRID |
| 088 | Bibliofiling 3 | Arrange | REF-030 | 行列计数约束下的多格块放置 | GRID_PLACEMENT | PROCEDURAL |
| 089 | Jewellery Jumble | Slide | REF-015 | 整行整列平移复原图像 | GRID_TRANSFORM | PROCEDURAL |
| 090 | Very Specific Scoops 2 | Arrange | REF-049 | 多条自然语言限制下的顺序选择 | CSP_ASSIGNMENT | PROCEDURAL |
| 091 | A Ship of Tiles | Tile | REF-019 | 固定尺寸彩色图层叠加成图 | LAYER_COMPOSITING | PROCEDURAL |
| 092 | Tank Goodness | Calculate | REF-035 | 旋转遮挡物的完整计数 | VISUAL_INSPECTION | HYBRID |
| 093 | Stacks of Stock | Arrange | REF-072 | 容量限制下的多箱堆栈排序 | REARRANGEMENT | PROCEDURAL |
| 094 | Tethered Ted | Circle Answer | REF-073 | 复杂缠绕线的端点追踪 | VISUAL_INSPECTION | PROCEDURAL |
| 095 | Troubled Waters 2 | Arrange | REF-064 | 障碍区域中的自由拼块桥接 | GEOMETRIC_PLACEMENT | HYBRID |
| 096 | Perplexing Patterns | Arrange | REF-074 | 立方体展开网格精确覆盖 | EXACT_COVER_PARTITION | PROCEDURAL |
| 097 | Pumpkin Purveyors | Arrange | REF-075 | 总重与件数约束的多组分配 | CSP_ASSIGNMENT | PROCEDURAL |
| 098 | A Troublesome Tent | Arrange | REF-076 | 边界属性匹配拼图与多余片 | PIECE_ASSEMBLY | PROCEDURAL |
| 099 | Brownie Points | Arrange | REF-077 | 固定件与异色邻接组成目标图形 | GRID_PLACEMENT | PROCEDURAL |
| 100 | Directing a Delivery 2 | Arrange | REF-027 | 符号到指令的映射编程 | PROGRAM_EXECUTION | PROCEDURAL |
| 101 | In the Balance | Arrange | REF-078 | 重叠邻域和的平衡排列 | CSP_ASSIGNMENT | PROCEDURAL |
| 102 | Troubled Waters 3 | Arrange | REF-064 | 障碍区域中的自由拼块桥接 | GEOMETRIC_PLACEMENT | HYBRID |
| 103 | Poster Predator | Slide | REF-015 | 整行整列平移复原图像 | GRID_TRANSFORM | PROCEDURAL |
| 104 | Finding Ambrosia | Select | REF-079 | 平行文本比对破译符号 | RULE_DISCOVERY | HYBRID |
| 105 | Slicing Things Up | Divide | REF-080 | 相邻配对且组合不重复的分割 | EXACT_COVER_PARTITION | PROCEDURAL |
| 106 | Tethered Ted 2 | Circle Answer | REF-073 | 复杂缠绕线的端点追踪 | VISUAL_INSPECTION | PROCEDURAL |
| 107 | Lighten Up 2 | Arrange | REF-003 | 覆盖且同色射线不相交 | GEOMETRIC_PLACEMENT | HYBRID |
| 108 | The Path of True Love | Select | REF-081 | 时间奇偶条件下的必经边 | GRAPH_DEDUCTION | PROCEDURAL |
| 109 | A Slippery Surface | Find Route | REF-082 | 惯性滑行与一次性脆弱地面 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 110 | Pesky Patterns | Arrange | REF-074 | 立方体展开网格精确覆盖 | EXACT_COVER_PARTITION | PROCEDURAL |
| 111 | Stacks of Stock 2 | Arrange | REF-072 | 容量限制下的多箱堆栈排序 | REARRANGEMENT | PROCEDURAL |
| 112 | A Puzzling Pyramid | Arrange | REF-083 | 相邻差值生成上层的数字金字塔 | CSP_ASSIGNMENT | PROCEDURAL |
| 113 | Shunting into Sidings 2 | Arrange | REF-038 | 机车调度与车厢顺序复原 | REARRANGEMENT | PROCEDURAL |
| 114 | Copy Cats 2 | Find Route | REF-026 | 同步角色与条件自动移动 | MULTI_AGENT_ROUTE | PROCEDURAL |
| 115 | Dial Trial 2 | Calculate | REF-009 | 旋转分区使各区符号和相等 | ROTATION_CONSTRAINT | PROCEDURAL |
| 116 | Funky Hooks 2 | Sequence | REF-010 | 周期障碍下的时序移动 | TIME_EXPANDED_ROUTE | PROCEDURAL |
| 117 | A Laborious 9 Litres | Calculate | REF-011 | 定容器皿量取目标体积 | MEASUREMENT_TRANSFER | PROCEDURAL |
| 118 | Mutiny! 2 | Solitaire | REF-007 | 连续跳跃并翻转被跨越棋子 | TOKEN_TRANSITION | PROCEDURAL |
| 119 | Jumbled Junctions | Select | REF-084 | 相对朝向指令追踪 | PROGRAM_EXECUTION | PROCEDURAL |
| 120 | Snoozysnore's Plan! | Select | REF-085 | 碰撞反射并旋转反射板 | BEAM_REFLECTION | PROCEDURAL |
| 121 | Touch Ten Buttons | Select | REF-086 | 行列计数的固定数量二元选择 | CSP_ASSIGNMENT | PROCEDURAL |
| 122 | Snoozysnore Returns! | Select | REF-085 | 碰撞反射并旋转反射板 | BEAM_REFLECTION | PROCEDURAL |
| 123 | Nose to Nose 3 | Arrange | REF-050 | 有限传递距离和空位的标记重排 | REARRANGEMENT | PROCEDURAL |
| 124 | A Slippery Surface 2 | Find Route | REF-082 | 惯性滑行与一次性脆弱地面 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 125 | Stacks of Stock 3 | Arrange | REF-072 | 容量限制下的多箱堆栈排序 | REARRANGEMENT | PROCEDURAL |
| 126 | Thirst for Answers | Arrange | REF-062 | 带析取或假线索的唯一分配 | CSP_ASSIGNMENT | PROCEDURAL |
| 127 | Bemused Bunnies 2 | Arrange | REF-060 | 重排道路面板连接成对端点 | GRID_PLACEMENT | PROCEDURAL |
| 128 | Shunting into Sidings 3 | Arrange | REF-038 | 机车调度与车厢顺序复原 | REARRANGEMENT | PROCEDURAL |
| 129 | Tough-to-Reach Tea | Slide | REF-087 | 拥挤空间中的目标块移出 | SLIDING_PHYSICS | PROCEDURAL |
| 130 | Mixed Swine Racing | Arrange | REF-042 | 每次携带相邻一对的排列复原 | REARRANGEMENT | PROCEDURAL |
| 131 | Forest Friends 2 | Arrange | REF-045 | 不同步长对象的路径位置布置 | GRID_PLACEMENT | PROCEDURAL |
| 132 | An Epic Quest 2 | Slide | REF-046 | 可重排道路的分阶段路线 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 133 | A Boatload of Bother | Divide | REF-039 | 环形相邻定长分组等和 | EXACT_COVER_PARTITION | PROCEDURAL |
| 134 | Airship's Destination 3 | Find Route | REF-001 | 有限燃料补给路径 | RESOURCE_ROUTE | PROCEDURAL |
| 135 | A String of Jewels 2 | Rope | REF-040 | 经过全部锚点的单环内外分离 | LINE_REGION_GEOMETRY | HYBRID |
| 136 | Directing a Delivery 3 | Arrange | REF-027 | 符号到指令的映射编程 | PROGRAM_EXECUTION | PROCEDURAL |
| 137 | A Troublesome Tent 2 | Arrange | REF-076 | 边界属性匹配拼图与多余片 | PIECE_ASSEMBLY | PROCEDURAL |
| 138 | In the Balance 2 | Arrange | REF-078 | 重叠邻域和的平衡排列 | CSP_ASSIGNMENT | PROCEDURAL |
| 139 | A Puzzling Pyramid 2 | Arrange | REF-083 | 相邻差值生成上层的数字金字塔 | CSP_ASSIGNMENT | PROCEDURAL |
| 140 | Potion Placement 2 | Arrange | REF-069 | 多源最短距离约束放置 | CSP_ASSIGNMENT | PROCEDURAL |
| 141 | Thick As Thieves 2 | Arrange | REF-054 | 方形轮廓上的等权重布局 | GRID_PLACEMENT | PROCEDURAL |
| 142 | X Marks...? | Circle Answer | REF-088 | 编码指令在球面路径上定位 | PROGRAM_EXECUTION | HYBRID |
| 143 | The Azran Eggs | Ancient Azran Mystery | REF-089 | 可平移形状掩模的网格翻转 | TOGGLE_NETWORK | PROCEDURAL |
| 144 | Medal Match-Up | Sequence | REF-090 | 不同固定步长圆环令牌归位 | REARRANGEMENT | PROCEDURAL |
| 145 | Riddle-Me-Key | Arrange | REF-091 | 立方体展开面与对面数字 | SPATIAL_TRANSFORM | PROCEDURAL |
| 146 | Sprint and Switch! | Find Route | REF-092 | 坍塌路径上收集全部开关 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 147 | Room of Doom | Find Route | REF-093 | 视线守卫下的潜行与侧后消除 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 148 | A Groovy Lever | Sequence | REF-094 | 旋转局部方块重建连续通道 | GRID_TRANSFORM | PROCEDURAL |
| 149 | Exit on the Left | Find Route | REF-095 | 周期旋转危险与不可回头地板 | TIME_EXPANDED_ROUTE | PROCEDURAL |
| 150 | The Azran Legacy | Sequence | REF-096 | 叙事提示驱动的符号状态机 | TOGGLE_NETWORK | BESPOKE |
| 151 | Fuel's Errand 3 | Arrange | REF-034 | 使用全部管件组成单一连通管道 | GRID_PLACEMENT | PROCEDURAL |
| 152 | Touch Ten Buttons 2 | Select | REF-086 | 行列计数的固定数量二元选择 | CSP_ASSIGNMENT | PROCEDURAL |
| 153 | Room of Doom 2 | Find Route | REF-093 | 视线守卫下的潜行与侧后消除 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 154 | Reggie's Slidy Ride 3 | Slide | REF-008 | 碰撞滑行与落穴填充 | SLIDING_PHYSICS | PROCEDURAL |
| 155 | Burger Building 3 | Solitaire | REF-058 | 单跳移除棋子的中心收束 | TOKEN_TRANSITION | PROCEDURAL |
| 156 | Lighten Up 3 | Arrange | REF-003 | 覆盖且同色射线不相交 | GEOMETRIC_PLACEMENT | HYBRID |
| 157 | Funky Hooks 3 | Sequence | REF-010 | 周期障碍下的时序移动 | TIME_EXPANDED_ROUTE | PROCEDURAL |
| 158 | A Puzzling Pyramid 3 | Arrange | REF-083 | 相邻差值生成上层的数字金字塔 | CSP_ASSIGNMENT | PROCEDURAL |
| 159 | Blooming Flowers 3 | Arrange | REF-014 | 带颜色邻接约束的多格块铺装 | GRID_PLACEMENT | PROCEDURAL |
| 160 | Sprint and Switch! 2 | Find Route | REF-092 | 坍塌路径上收集全部开关 | DYNAMIC_GRID_ROUTE | PROCEDURAL |
| 161 | A Groovy Lever 2 | Sequence | REF-094 | 旋转局部方块重建连续通道 | GRID_TRANSFORM | PROCEDURAL |
| 162 | Exit on the Left 2 | Find Route | REF-095 | 周期旋转危险与不可回头地板 | TIME_EXPANDED_ROUTE | PROCEDURAL |
| 163 | Mutiny! 3 | Solitaire | REF-007 | 连续跳跃并翻转被跨越棋子 | TOKEN_TRANSITION | PROCEDURAL |
| 164 | Snoozysnore Strikes! | Select | REF-085 | 碰撞反射并旋转反射板 | BEAM_REFLECTION | PROCEDURAL |
| 165 | A Troublesome Table | Slide | REF-087 | 拥挤空间中的目标块移出 | SLIDING_PHYSICS | PROCEDURAL |
