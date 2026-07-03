import { PuzzleType } from '../models/PuzzleData';
import { SeededRandom } from '../models/SeededRandom';
// 剧本主题配置库 (强制 Category 0 必须为隐式的有序维度)
const THEME_BANK = [
    {
        id: 'postman',
        context: '空中岛屿的邮差比赛正在进行。各位邮差按照先后顺序依次到达了不同的目的地，并送达了不同的物品。',
        orderedLabel: '顺序',
        categories: [
            { id: 'sequence', title: '到达顺序', items: ['第一站', '第二站', '第三站', '第四站', '第五站'] },
            { id: 'person', title: '邮差', items: ['蓝帽邮差', '红发少女', '机械鸟', '老船长', '云鲸骑士'] },
            { id: 'destination', title: '目的地', items: ['钟楼', '云港', '玻璃温室', '灯塔', '风车村'] },
            { id: 'item', title: '物品', items: ['银信筒', '蓝羽毛', '黄铜钥匙', '旧地图', '星形邮票'] }
        ],
        templates: {
            SAME: [
                "带着【{i1}】的正好也是负责【{i2}】的那个。",
                "查阅【{i1}】的寄送记录，负责它的与【{i2}】是同一匹配。"
            ],
            NOT_SAME: [
                "可以确认，【{i1}】和【{i2}】毫无关联。",
                "【{i1}】并没有出现在【{i2}】对应的记录里。"
            ],
            BEFORE: [
                "负责【{i1}】的送达时间，早于【{i2}】。",
                "在【{i2}】出现之前，【{i1}】就已经被安排好了。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的送达顺序是紧紧挨着的。",
                "只要知道【{i1}】在第几站，它的上一站或下一站必定是【{i2}】。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】的送达顺序中间至少隔了一站。",
                "【{i1}】绝对不可能挨着【{i2}】送达。"
            ]
        }
    },
    {
        id: 'tower',
        context: '古老法师塔的每一层都封印着不同的怪物，守护着不同的神器，且需要不同的魔咒才能开启。',
        orderedLabel: '楼层',
        categories: [
            { id: 'floor', title: '楼层', items: ['一楼', '二楼', '三楼', '四楼', '五楼'] },
            { id: 'monster', title: '怪物', items: ['哥布林', '牛头人', '吸血鬼', '石像鬼', '巫妖'] },
            { id: 'artifact', title: '神器', items: ['真理之镜', '火之石', '贤者披风', '时空沙漏', '雷神战锤'] },
            { id: 'spell', title: '魔咒', items: ['火焰爆裂', '冰霜新星', '奥术飞弹', '雷霆之怒', '圣光庇护'] }
        ],
        templates: {
            SAME: [
                "探索录记载，【{i1}】和【{i2}】在同一层。",
                "面对【{i1}】时，必然也伴随着【{i2}】的存在。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】绝对不可能出现在同一楼层。",
                "如果你找到了【{i1}】，那就别指望在那里看到【{i2}】。"
            ],
            BEFORE: [
                "【{i1}】所在的楼层低于【{i2}】所在的楼层。",
                "你需要先经过【{i1}】所在的层数，然后往上走才能到达【{i2}】所在的层数。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】分布在相邻的两个楼层。",
                "【{i1}】的正上方或者正下方楼层，就是【{i2}】的所在地。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】所在的楼层并没有紧挨着。",
                "【{i1}】的上下楼层里，绝对没有【{i2}】。"
            ]
        }
    },
    {
        id: 'spacestation',
        context: '深空探测站的五位宇航员分别来自不同国家，负责不同舱段，研究不同课题，还养了不同的太空宠物。',
        orderedLabel: '舱段编号',
        categories: [
            { id: 'module', title: '舱段', items: ['A舱', 'B舱', 'C舱', 'D舱', 'E舱'] },
            { id: 'astronaut', title: '宇航员', items: ['林指挥官', '伊万博士', '阿莎工程师', '马克医生', '田中植物学家'] },
            { id: 'country', title: '国籍', items: ['中国', '俄罗斯', '印度', '美国', '日本'] },
            { id: 'research', title: '课题', items: ['暗物质', '微重力植物', '太空医学', '辐射防护', '量子通信'] },
            { id: 'pet', title: '太空宠物', items: ['机械猫', '荧光鱼', '苔藓龟', '基因蚕', '悬浮仓鼠'] }
        ],
        templates: {
            SAME: [
                "任务日志显示，【{i1}】和【{i2}】属于同一舱段。",
                "在【{i1}】所在的区域，你也能找到【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】分属不同的舱段，没有交集。",
                "负责【{i1}】的宇航员并不负责【{i2}】。"
            ],
            BEFORE: [
                "【{i1}】所在舱段的编号比【{i2}】的更靠前。",
                "从船头数起，【{i1}】在【{i2}】之前。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的舱段是相邻的。",
                "【{i1}】的隔壁就是【{i2}】所在的舱段。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】之间至少隔了一个舱段。",
                "【{i1}】的舱段并不与【{i2}】相邻。"
            ]
        }
    },
    {
        id: 'tea',
        context: '一场茶道雅集上，五位茶客按入座先后顺序落座，各自带来了不同产地的茶叶，使用不同材质的茶具，冲泡了不同汤色的茶汤。',
        orderedLabel: '入座顺序',
        categories: [
            { id: 'seat', title: '入座顺序', items: ['第一位', '第二位', '第三位', '第四位', '第五位'] },
            { id: 'guest', title: '茶客', items: ['青衣客', '白衣居士', '紫袍道人', '灰衫老者', '黄衫少女'] },
            { id: 'origin', title: '茶叶产地', items: ['武夷山', '安溪', '西湖', '云南', '福鼎'] },
            { id: 'ware', title: '茶具材质', items: ['紫砂壶', '青瓷盏', '玻璃杯', '银壶', '陶碗'] },
            { id: 'color', title: '汤色', items: ['琥珀金', '翠绿', '橙红', '蜜黄', '清透白'] }
        ],
        templates: {
            SAME: [
                "【{i1}】和【{i2}】属于同一位茶客。",
                "使用【{i1}】的那位客人，也带了【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】并非来自同一位茶客。",
                "带【{i1}】来的人，并没有带【{i2}】。"
            ],
            BEFORE: [
                "带【{i1}】的茶客比带【{i2}】的先入座。",
                "【{i1}】的主人比【{i2}】的主人更早到场。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的主人座位相邻。",
                "【{i1}】的茶客旁边坐的就是带【{i2}】的人。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】的主人之间隔着至少一个座位。",
                "带【{i1}】的人和带【{i2}】的人没有挨着坐。"
            ]
        }
    },
    {
        id: 'museum',
        context: '博物馆的五个展厅按参观路线排列，每个展厅展出不同朝代的文物，由不同赞助人资助，配有不同的安保等级。',
        orderedLabel: '参观顺序',
        categories: [
            { id: 'hall', title: '展厅', items: ['第一厅', '第二厅', '第三厅', '第四厅', '第五厅'] },
            { id: 'dynasty', title: '朝代', items: ['商周', '秦汉', '唐宋', '元明', '清代'] },
            { id: 'sponsor', title: '赞助人', items: ['陈氏基金会', '海外华侨会', '文化部', '私人藏家', '大学研究院'] },
            { id: 'security', title: '安保等级', items: ['特级', '一级', '二级', '三级', '普通'] }
        ],
        templates: {
            SAME: [
                "展览手册标注，【{i1}】和【{i2}】在同一个展厅。",
                "【{i1}】所在的展厅同时展出了【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】分别在不同的展厅。",
                "展出【{i1}】的展厅里没有【{i2}】。"
            ],
            BEFORE: [
                "参观路线中，【{i1}】的展厅在【{i2}】之前。",
                "你会先看到【{i1}】，然后才到【{i2}】的展厅。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的展厅是相邻的。",
                "看完【{i1}】出来，隔壁就是【{i2}】的展厅。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】的展厅不相邻。",
                "从【{i1}】到【{i2}】的展厅，中间至少隔了一个。"
            ]
        }
    },
    {
        id: 'concert',
        context: '一场音乐会上，五位演奏家按出场顺序依次表演，各自演奏不同乐器，来自不同乐团，表演了不同风格的曲目。',
        orderedLabel: '出场顺序',
        categories: [
            { id: 'order', title: '出场', items: ['开场', '第二位', '中场', '第四位', '压轴'] },
            { id: 'musician', title: '演奏家', items: ['林小提琴', '张钢琴', '王大提琴', '李长笛', '赵单簧管'] },
            { id: 'orchestra', title: '乐团', items: ['国家交响', '室内乐团', '爵士大乐队', '民族乐团', '电子合奏团'] },
            { id: 'style', title: '曲风', items: ['古典奏鸣曲', '爵士 improvisation', '民谣叙事', '现代极简', '浪漫主义'] }
        ],
        templates: {
            SAME: [
                "节目单上，【{i1}】和【{i2}】属于同一位演奏家。",
                "演奏【{i1}】的那位也带来了【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】来自不同的演奏家。",
                "负责【{i1}】的人并没有演奏【{i2}】。"
            ],
            BEFORE: [
                "演奏【{i1}】的出场时间早于【{i2}】。",
                "【{i1}】的表演在【{i2}】之前进行。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的出场顺序是连着的。",
                "【{i1}】的前一个或后一个节目就是【{i2}】。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】之间至少隔了一个节目。",
                "【{i1}】的演出并不是紧挨着【{i2}】的。"
            ]
        }
    },
    {
        id: 'lab',
        context: '生物实验室的五个实验台按编号排列，每个实验台上进行不同类型的实验，使用不同型号的设备，由不同研究员负责。',
        orderedLabel: '实验台编号',
        categories: [
            { id: 'bench', title: '实验台', items: ['1号台', '2号台', '3号台', '4号台', '5号台'] },
            { id: 'experiment', title: '实验类型', items: ['基因编辑', '细胞培养', '蛋白质分析', '药物筛选', '微生物观察'] },
            { id: 'equipment', title: '设备', items: ['PCR仪', '离心机', '显微镜', '光谱仪', '培养箱'] },
            { id: 'researcher', title: '研究员', items: ['陈博士', '刘博士后', '黄教授', '吴助理', '郑客座'] }
        ],
        templates: {
            SAME: [
                "实验记录显示，【{i1}】和【{i2}】在同一个实验台上。",
                "使用【{i1}】的实验台同时也用到了【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】在不同的实验台上进行。",
                "负责【{i1}】的实验台并没有【{i2}】。"
            ],
            BEFORE: [
                "【{i1}】的实验台编号比【{i2}】的小。",
                "【{i1}】所在的台面在【{i2}】的左边。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的实验台是相邻的。",
                "【{i1}】旁边的台子就是【{i2}】所在的位置。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】之间至少隔了一个实验台。",
                "【{i1}】的实验台并不紧挨着【{i2}】的。"
            ]
        }
    },
    {
        id: 'festival',
        context: '灯笼节上，五条花灯街按位置排列，每条街展出了不同造型的花灯，由不同匠人制作，使用不同的光源材料。',
        orderedLabel: '街道位置',
        categories: [
            { id: 'street', title: '花灯街', items: ['东街', '南街', '中街', '北街', '西街'] },
            { id: 'lantern', title: '花灯造型', items: ['龙凤呈祥', '鲤鱼跃门', '莲花仙子', '麒麟瑞兽', '孔雀开屏'] },
            { id: 'craftsman', title: '匠人', items: ['老周头', '绣娘阿巧', '纸艺刘', '竹编陈', '画师孙'] },
            { id: 'light', title: '光源', items: ['红烛', '油灯', '萤石', ' LED 丝', '日光管'] }
        ],
        templates: {
            SAME: [
                "灯会指南上，【{i1}】和【{i2}】在同一条街。",
                "展出【{i1}】的那条街也展出了【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】在不同的花灯街上。",
                "制作【{i1}】的匠人并没有参与【{i2}】。"
            ],
            BEFORE: [
                "【{i1}】所在的街道比【{i2}】更靠东。",
                "从东往西走，你会先遇到【{i1}】再遇到【{i2}】。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】所在的街道是相邻的。",
                "逛完【{i1}】的街，旁边就是【{i2}】的街。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】之间隔着至少一条街。",
                "【{i1}】所在的街并不与【{i2}】相邻。"
            ]
        }
    },
    {
        id: 'restaurant',
        context: '美食街上五家餐厅按门牌号排列，每家经营不同菜系，由不同主厨掌勺，有不同的招牌菜和不同的装修风格。',
        orderedLabel: '门牌号',
        categories: [
            { id: 'number', title: '门牌', items: ['1号', '2号', '3号', '4号', '5号'] },
            { id: 'cuisine', title: '菜系', items: ['川菜', '粤菜', '日料', '法餐', '意大利菜'] },
            { id: 'chef', title: '主厨', items: ['辣王老李', '蒸师傅阿德', '刀神佐藤', '酱料皮埃尔', '面点马可'] },
            { id: 'specialty', title: '招牌菜', items: ['水煮鱼', '叉烧饭', '握寿司', '红酒炖牛肉', '松露意面'] },
            { id: 'decor', title: '装修风格', items: ['工业风', '田园风', '禅意和风', '复古欧式', '现代极简'] }
        ],
        templates: {
            SAME: [
                "美食攻略上写着，【{i1}】和【{i2}】属于同一家店。",
                "【{i1}】所在的餐厅同时以【{i2}】为特色。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】来自不同的餐厅。",
                "卖【{i1}】的店并不卖【{i2}】。"
            ],
            BEFORE: [
                "【{i1}】的门牌号比【{i2}】小。",
                "从街头数起，【{i1}】在【{i2}】之前。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的餐厅是隔壁邻居。",
                "【{i1}】的店旁边就是卖【{i2}】的店。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】之间至少隔了一家店。",
                "【{i1}】的餐厅并不与【{i2}】相邻。"
            ]
        }
    },
    {
        id: 'garden',
        context: '皇家花园的五个区域按游览路径排列，每个区域种着不同花卉，由不同园丁打理，配有不同的景观装饰。',
        orderedLabel: '游览顺序',
        categories: [
            { id: 'zone', title: '区域', items: ['入口区', '东侧区', '中心区', '西侧区', '深处区'] },
            { id: 'flower', title: '花卉', items: ['牡丹', '樱花', '荷花', '梅花', '兰花'] },
            { id: 'gardener', title: '园丁', items: ['老赵', '花姐', '小林', '阿梅', '老陈'] },
            { id: 'decor', title: '景观', items: ['石桥', '凉亭', '假山', '水池', '回廊'] }
        ],
        templates: {
            SAME: [
                "花园地图上，【{i1}】和【{i2}】在同一个区域。",
                "种植【{i1}】的区域也设有【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】在不同的区域。",
                "打理【{i1}】的园丁并不负责【{i2}】。"
            ],
            BEFORE: [
                "游览路线上，【{i1}】的区域在【{i2}】之前。",
                "你会先经过【{i1}】的区域，然后才到达【{i2}】。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的区域是相邻的。",
                "【{i1}】的区域旁边就是【{i2}】的区域。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】之间至少隔了一个区域。",
                "【{i1}】的区域并不与【{i2}】相邻。"
            ]
        }
    },
    {
        id: 'train',
        context: '一列特快列车上，五节车厢按编号排列，每节车厢有不同的用途，由不同乘务员负责，提供不同的餐饮服务。',
        orderedLabel: '车厢编号',
        categories: [
            { id: 'car', title: '车厢', items: ['1号车厢', '2号车厢', '3号车厢', '4号车厢', '5号车厢'] },
            { id: 'purpose', title: '用途', items: ['商务座', '一等座', '餐车', '观光车厢', '娱乐车厢'] },
            { id: 'attendant', title: '乘务员', items: ['小张', '阿美', '老王', '露西', '小陈'] },
            { id: 'meal', title: '餐饮', items: ['中式套餐', '西式简餐', '日式便当', '甜品茶点', '地方小吃'] }
        ],
        templates: {
            SAME: [
                "列车时刻表上，【{i1}】和【{i2}】在同一节车厢。",
                "【{i1}】所在的车厢也提供【{i2}】。"
            ],
            NOT_SAME: [
                "【{i1}】和【{i2}】在不同的车厢。",
                "负责【{i1}】的乘务员并不负责【{i2}】。"
            ],
            BEFORE: [
                "【{i1}】的车厢编号比【{i2}】小。",
                "从车头数起，【{i1}】在【{i2}】之前。"
            ],
            NEXT_TO: [
                "【{i1}】和【{i2}】的车厢是相邻的。",
                "【{i1}】的车厢隔壁就是【{i2}】的车厢。"
            ],
            NOT_NEXT_TO: [
                "【{i1}】和【{i2}】之间至少隔了一节车厢。",
                "【{i1}】的车厢并不与【{i2}】相邻。"
            ]
        }
    }
];
export class LogicGridEngine {
    constructor() {
        this.type = PuzzleType.LOGIC_GRID;
        this.isBank = false;
        this.rng = new SeededRandom(SeededRandom.randomSeed());
    }
    getRandomItem(arr) {
        return this.rng.pick(arr);
    }
    shuffleArray(arr) {
        return this.rng.shuffle(arr);
    }
    generate(difficulty, seed) {
        const actualSeed = seed ?? SeededRandom.randomSeed();
        this.rng = new SeededRandom(actualSeed);
        let size = 3;
        let numCats = 3;
        // Difficulty scaling (size = items per category, numCats = total categories)
        if (difficulty >= 4 && difficulty <= 6) {
            size = 4;
            numCats = 3;
        }
        else if (difficulty >= 7) {
            size = 4;
            numCats = 4; // Max 4x4 to keep it extremely fast in JS
        }
        const theme = this.rng.pick(THEME_BANK);
        // C0 is ordered, do not shuffle items for C0. 
        // We only truncate it to 'size'.
        const selectedCats = [];
        selectedCats.push({
            id: theme.categories[0].id,
            title: theme.categories[0].title,
            items: theme.categories[0].items.slice(0, size)
        });
        for (let c = 1; c < numCats; c++) {
            const shuffledItems = this.shuffleArray(theme.categories[c].items);
            selectedCats.push({
                id: theme.categories[c].id,
                title: theme.categories[c].title,
                items: shuffledItems.slice(0, size)
            });
        }
        const perms = this.getPermutations(size);
        // 1. Build Truth
        const truthAssignment = [];
        truthAssignment.push(Array.from({ length: size }, (_, idx) => idx));
        for (let c = 1; c < numCats; c++) {
            truthAssignment.push(this.rng.pick(perms));
        }
        // 2. Generate all possible clues
        const allClues = [];
        for (let c1 = 0; c1 < numCats; c1++) {
            for (let c2 = c1; c2 < numCats; c2++) {
                for (let p1 = 0; p1 < size; p1++) {
                    for (let p2 = 0; p2 < size; p2++) {
                        // Don't compare same item to itself
                        if (c1 === c2 && p1 === p2)
                            continue;
                        // To avoid duplicates, enforce an ordering on generation
                        // For different categories, ensure c1 < c2
                        if (c1 === c2 && p1 > p2)
                            continue; // For same category, only do p1 < p2 to prevent symmetry
                        const i1 = truthAssignment[c1][p1];
                        const i2 = truthAssignment[c2][p2];
                        const name1 = selectedCats[c1].items[i1];
                        const name2 = selectedCats[c2].items[i2];
                        if (p1 === p2) {
                            if (c1 !== c2) {
                                const desc = this.getRandomItem(theme.templates.SAME).replace('{i1}', name1).replace('{i2}', name2);
                                allClues.push({ type: 'SAME', c1Idx: c1, i1Idx: i1, c2Idx: c2, i2Idx: i2, description: desc });
                            }
                        }
                        else {
                            // NOT_SAME (only makes sense if different categories. Same category is trivially NOT_SAME)
                            if (c1 !== c2) {
                                const desc = this.getRandomItem(theme.templates.NOT_SAME).replace('{i1}', name1).replace('{i2}', name2);
                                allClues.push({ type: 'NOT_SAME', c1Idx: c1, i1Idx: i1, c2Idx: c2, i2Idx: i2, description: desc });
                            }
                            // Spatial Clues based on Ordered Base Dimension (p1 and p2)
                            // To keep difficulty balanced and clue pool manageable, we randomly decide which spatial clue to add.
                            // We don't add ALL spatial clues for every pair, or the prune step becomes too trivial.
                            if (p1 < p2) {
                                const desc = this.getRandomItem(theme.templates.BEFORE).replace('{i1}', name1).replace('{i2}', name2);
                                allClues.push({ type: 'BEFORE', c1Idx: c1, i1Idx: i1, c2Idx: c2, i2Idx: i2, description: desc });
                            }
                            else if (p1 > p2) {
                                const desc = this.getRandomItem(theme.templates.BEFORE).replace('{i1}', name2).replace('{i2}', name1);
                                allClues.push({ type: 'BEFORE', c1Idx: c2, i1Idx: i2, c2Idx: c1, i2Idx: i1, description: desc });
                            }
                            if (Math.abs(p1 - p2) === 1) {
                                const desc = this.getRandomItem(theme.templates.NEXT_TO).replace('{i1}', name1).replace('{i2}', name2);
                                allClues.push({ type: 'NEXT_TO', c1Idx: c1, i1Idx: i1, c2Idx: c2, i2Idx: i2, description: desc });
                            }
                            else {
                                const desc = this.getRandomItem(theme.templates.NOT_NEXT_TO).replace('{i1}', name1).replace('{i2}', name2);
                                allClues.push({ type: 'NOT_NEXT_TO', c1Idx: c1, i1Idx: i1, c2Idx: c2, i2Idx: i2, description: desc });
                            }
                        }
                    }
                }
            }
        }
        // 3. Backtracking Pruning
        this.shuffleArray(allClues);
        let currentClues = [...allClues];
        for (let i = currentClues.length - 1; i >= 0; i--) {
            const clueToTest = currentClues[i];
            currentClues.splice(i, 1);
            if (this.countSolutions(currentClues, numCats, size, perms) > 1) {
                currentClues.splice(i, 0, clueToTest); // Revert
            }
        }
        // 4. Assemble Results
        const goalState = [];
        for (let p = 0; p < size; p++) {
            const row = {};
            for (let c = 0; c < numCats; c++) {
                const catId = selectedCats[c].id;
                const itemIdx = truthAssignment[c][p];
                row[catId] = selectedCats[c].items[itemIdx];
            }
            goalState.push(row);
        }
        return {
            id: `logic_grid_${actualSeed}`,
            type: PuzzleType.LOGIC_GRID,
            difficulty: difficulty,
            title: `逻辑网格 · ${theme.categories[0].title}`,
            description: `根据线索推导出每个${theme.orderedLabel}对应的组合。请利用排查网格逐步推理。`,
            narrative_setup: theme.context + ` (注意维度：【${theme.categories[0].title}】是有隐藏先后顺序的)`,
            initial_state: {
                categories: selectedCats,
                clues: currentClues.map(c => c.description)
            },
            goal_state: { truth: goalState },
            hints: [
                `提示一：从涉及【${theme.orderedLabel}】最少的线索开始推理。`,
                `提示二：利用排除法，每确定一个关联就能排除其他可能性。`,
                `提示三：注意【${theme.orderedLabel}】是有先后顺序的维度。`,
            ],
            seed: actualSeed,
        };
    }
    getPermutations(n) {
        const res = [];
        const arr = Array.from({ length: n }, (_, i) => i);
        function permute(current, remaining) {
            if (remaining.length === 0) {
                res.push([...current]);
                return;
            }
            for (let i = 0; i < remaining.length; i++) {
                current.push(remaining[i]);
                const nextRemaining = remaining.slice();
                nextRemaining.splice(i, 1);
                permute(current, nextRemaining);
                current.pop();
            }
        }
        permute([], arr);
        return res;
    }
    checkClue(clue, assignment) {
        let p1 = -1, p2 = -1;
        for (let p = 0; p < assignment[0].length; p++) {
            if (assignment[clue.c1Idx][p] === clue.i1Idx)
                p1 = p;
            if (assignment[clue.c2Idx][p] === clue.i2Idx)
                p2 = p;
        }
        switch (clue.type) {
            case 'SAME': return p1 === p2;
            case 'NOT_SAME': return p1 !== p2;
            case 'BEFORE': return p1 < p2;
            case 'NEXT_TO': return Math.abs(p1 - p2) === 1;
            case 'NOT_NEXT_TO': return Math.abs(p1 - p2) !== 1;
            default: return true;
        }
    }
    countSolutions(clues, numCats, size, perms) {
        const actualClues = clues.filter(c => c.type !== undefined);
        let count = 0;
        const numPerms = perms.length;
        if (numCats === 3) {
            for (let i = 0; i < numPerms; i++) {
                for (let j = 0; j < numPerms; j++) {
                    const assignment = [Array.from({ length: size }, (_, idx) => idx), perms[i], perms[j]];
                    let valid = true;
                    for (const clue of actualClues) {
                        if (!this.checkClue(clue, assignment)) {
                            valid = false;
                            break;
                        }
                    }
                    if (valid) {
                        count++;
                        if (count > 1)
                            return count;
                    }
                }
            }
        }
        else if (numCats === 4) {
            for (let i = 0; i < numPerms; i++) {
                for (let j = 0; j < numPerms; j++) {
                    for (let k = 0; k < numPerms; k++) {
                        const assignment = [Array.from({ length: size }, (_, idx) => idx), perms[i], perms[j], perms[k]];
                        let valid = true;
                        for (const clue of actualClues) {
                            if (!this.checkClue(clue, assignment)) {
                                valid = false;
                                break;
                            }
                        }
                        if (valid) {
                            count++;
                            if (count > 1)
                                return count;
                        }
                    }
                }
            }
        }
        return count;
    }
}
//# sourceMappingURL=LogicGridEngine.js.map