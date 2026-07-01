import * as readline from 'readline';
import { LogicGridEngine } from './src/engines/LogicGridEngine.ts';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const engine = new LogicGridEngine();

console.log('====================================');
console.log('   爱因斯坦逻辑网格测试 (CLI 版)  ');
console.log('====================================\n');

rl.question('请输入你想测试的难度 (1-10，1是最简单，10是最难): ', (diffInput) => {
    const diff = parseInt(diffInput) || 3;
    
    console.log(`\n正在生成难度为 ${diff} 的纯逻辑谜题，请稍候...\n`);
    
    const startTime = Date.now();
    const puzzle = engine.generatePuzzle(diff);
    const duration = Date.now() - startTime;
    
    console.log(`(生成耗时: ${duration}ms)`);
    console.log('\n【可用元素】');
    puzzle.initial_state.categories.forEach((cat: any) => {
        console.log(`- ${cat.title}: ${cat.items.join(', ')}`);
    });
    
    console.log('\n【已知线索】');
    puzzle.initial_state.clues.forEach((clue: string, idx: number) => {
        console.log(`${idx + 1}. ${clue}`);
    });
    
    console.log('\n====================================');
    console.log('💡 提示：你可以拿出一张纸和笔，或者在脑海里画一个网格来推导。');
    
    rl.question('推导完成后，按回车键 (Enter) 查看标准答案...', () => {
        console.log('\n【标准答案】');
        console.table(puzzle.goal_state.truth);
        console.log('\n测试结束！');
        rl.close();
    });
});
