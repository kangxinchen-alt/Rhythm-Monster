/**
 * 游戏配置文件
 */

// 游戏配置
const CONFIG = {
    noteSpeed: 4,
    spawnInterval: 800,
    gameDuration: 60000,
    monsterCount: 3,
    playerHealth: 3,
    endlessHealth: 5, // 无尽模式初始血量
    judgeThreshold: { perfect: 50, great: 80, good: 120 },
    colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'],
    colorDarks: ['#cc4444', '#cc9900', '#44aa55', '#3366cc', '#7744aa'],
    keys: ['d', 'f', ' ', 'j', 'k'],
    monsterEmojis: ['👾', '👹', '👺', '🤖', '👻'],
    gameMode: 'timed', // 'timed' 或 'endless'
    // 新增配置
    emergencyNoteDistance: 150, // 僵尸距离底部多远时强制生成音符（像素）
    maxIdleTimeForLane: 3000, // 路径最大空闲时间（毫秒）
    emergencyNotePriority: true, // 紧急音符是否优先生成
    // 波次配置
    waveConfig: {
        1: {
            monsterCount: 3,
            monsterSpeed: 1.6,
            noteSpeed: 4,
            spawnInterval: 800,
            monstersToKill: 10
        },
        2: {
            monsterCount: 5,
            monsterSpeed: 1.8,
            noteSpeed: 4.5,
            spawnInterval: 700,
            monstersToKill: 15
        },
        3: {
            monsterCount: 6,
            monsterSpeed: 2.0,
            noteSpeed: 5,
            spawnInterval: 600,
            monstersToKill: 20
        }
    }
};

// 难度预设
const DIFFICULTY = {
    easy: { noteSpeed: 2.5, spawnInterval: 1000, monsterCount: 2, emergencyNoteDistance: 200, maxIdleTimeForLane: 4000 },
    normal: { noteSpeed: 4, spawnInterval: 800, monsterCount: 3, emergencyNoteDistance: 150, maxIdleTimeForLane: 3000 },
    hard: { noteSpeed: 6, spawnInterval: 500, monsterCount: 5, emergencyNoteDistance: 100, maxIdleTimeForLane: 2000 }
};

// 判定文字
const JUDGMENT_TEXT = {
    perfect: 'PERFECT',
    great: 'GREAT',
    good: 'GOOD',
    miss: 'MISS'
};

// 判定分数
const JUDGMENT_SCORE = {
    perfect: 100,
    great: 70,
    good: 40
};

// 怪物击杀得分
const MONSTER_KILL_SCORE = 200;
