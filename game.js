/**
 * 游戏主逻辑
 */

// 成就系统配置
const ACHIEVEMENTS = {
    firstBlood: {
        id: 'firstBlood',
        name: '首战告捷',
        description: '完成第一场游戏',
        icon: '⚔️',
        difficulty: 'easy',
        check: (stats) => stats.gamesPlayed >= 1
    },
    kill10: {
        id: 'kill10',
        name: '初露锋芒',
        description: '累计击杀10个怪物',
        icon: '🗡️',
        difficulty: 'easy',
        check: (stats) => stats.totalKills >= 10
    },
    kill50: {
        id: 'kill50',
        name: '英勇无敌',
        description: '累计击杀50个怪物',
        icon: '🏆',
        difficulty: 'medium',
        check: (stats) => stats.totalKills >= 50
    },
    kill100: {
        id: 'kill100',
        name: '怪物杀手',
        description: '累计击杀100个怪物',
        icon: '👑',
        difficulty: 'medium',
        check: (stats) => stats.totalKills >= 100
    },
    combo50: {
        id: 'combo50',
        name: '连击达人',
        description: '单局达成50连击',
        icon: '🔥',
        difficulty: 'medium',
        check: (stats) => stats.maxComboEver >= 50
    },
    combo100: {
        id: 'combo100',
        name: '连击大师',
        description: '单局达成100连击',
        icon: '💥',
        difficulty: 'hard',
        check: (stats) => stats.maxComboEver >= 100
    },
    perfect90: {
        id: 'perfect90',
        name: '完美主义',
        description: '单局完美率达到90%以上',
        icon: '⭐',
        difficulty: 'hard',
        check: (stats) => stats.bestPerfectRate >= 90
    },
    wave5: {
        id: 'wave5',
        name: '挑战极限',
        description: '无尽模式突破第5波',
        icon: '🎯',
        difficulty: 'medium',
        check: (stats) => stats.maxWaveEver >= 5
    },
    wave10: {
        id: 'wave10',
        name: '生存专家',
        description: '无尽模式突破第10波',
        icon: '🏅',
        difficulty: 'hard',
        check: (stats) => stats.maxWaveEver >= 10
    },
    score10000: {
        id: 'score10000',
        name: '高分玩家',
        description: '单局得分达到10000分',
        icon: '💎',
        difficulty: 'hard',
        check: (stats) => stats.bestScore >= 10000
    },
    // 新增高难度成就
    perfect100: {
        id: 'perfect100',
        name: '无瑕大师',
        description: '单局100%完美率',
        icon: '🌟',
        difficulty: 'legendary',
        check: (stats) => stats.bestPerfectRate >= 100
    },
    combo200: {
        id: 'combo200',
        name: '连击传奇',
        description: '单局达成200连击',
        icon: '⚡',
        difficulty: 'legendary',
        check: (stats) => stats.maxComboEver >= 200
    },
    wave20: {
        id: 'wave20',
        name: '不朽神话',
        description: '无尽模式突破第20波',
        icon: '👿',
        difficulty: 'legendary',
        check: (stats) => stats.maxWaveEver >= 20
    },
    score50000: {
        id: 'score50000',
        name: '传奇王者',
        description: '单局得分达到50000分',
        icon: '🏆',
        difficulty: 'legendary',
        check: (stats) => stats.bestScore >= 50000
    },
    kill500: {
        id: 'kill500',
        name: '屠魔圣手',
        description: '累计击杀500个怪物',
        icon: '🗡️',
        difficulty: 'legendary',
        check: (stats) => stats.totalKills >= 500
    },
    gamesPlayed100: {
        id: 'gamesPlayed100',
        name: '节奏大师',
        description: '累计游戏100局',
        icon: '🎮',
        difficulty: 'hard',
        check: (stats) => stats.gamesPlayed >= 100
    }
};

const gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
    playerHealth: 3,
    notes: [],
    monsters: [],
    bullets: [],
    lastSpawnTime: 0,
    startTime: 0,
    endTime: 0,
    pausedTime: 0,
    totalPausedTime: 0,
    monsterSpawnTimer: null,
    lastNoteSpawnByLane: [0, 0, 0, 0, 0],
    emergencySpawnedLanes: new Set(),
    currentWave: 1,
    monstersKilledInWave: 0,
    currentMonsterSpeed: 1.6,
    totalKills: 0,
    achievements: [],
    currentUser: null,
    userStats: {
        gamesPlayed: 0,
        totalKills: 0,
        maxComboEver: 0,
        bestPerfectRate: 0,
        maxWaveEver: 0,
        bestScore: 0,
        unlockedAchievements: []
    }
};

// DOM元素
const $ = id => document.getElementById(id);

// 轨道元素 (节奏区)
const tracks = [0,1,2,3,4].map(i => $(`track${i}`));
// 地图轨道元素
const mapLanes = [0,1,2,3,4].map(i => $(`lane${i}`));
// 键位提示元素
const keyIndicators = [0,1,2,3,4].map(i => $(`key${i}`));

// 初始化
function init() {
    $('startBtn').onclick = startGame;
    $('restartBtn').onclick = restartGame;
    
    // 暂停界面按钮
    const resumeBtn = $('resumeBtn');
    if (resumeBtn) resumeBtn.onclick = resumeGame;
    
    const returnMenuBtn = $('returnMenuBtn');
    if (returnMenuBtn) returnMenuBtn.onclick = returnToMenu;
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    // ESC键暂停/恢复
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gameState.isPlaying) {
            if (gameState.isPaused) {
                resumeGame();
            } else {
                pauseGame();
            }
        }
    });
    
    initSettings();
    initAuthSystem();
    loadUserFromStorage();
}

// 初始化设置
function initSettings() {
    const monsterSlider = $('monsterSlider');
    const monsterValue = $('monsterValue');
    const virtualKeys = $('virtualKeys');
    const posBtns = document.querySelectorAll('.pos-btn');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const durBtns = document.querySelectorAll('.dur-btn');
    const settingsPanel = document.querySelector('.settings');

    // 为设置面板添加事件监听
    const setupSettingsInteraction = (element) => {
        element.addEventListener('mousedown', pauseGame);
        element.addEventListener('touchstart', pauseGame);
        element.addEventListener('mouseup', resumeGame);
        element.addEventListener('touchend', resumeGame);
        element.addEventListener('mouseleave', resumeGame);
    };

    // 为设置面板和所有子元素添加交互事件
    setupSettingsInteraction(settingsPanel);
    settingsPanel.querySelectorAll('*').forEach(setupSettingsInteraction);

    monsterSlider.oninput = () => {
        CONFIG.monsterCount = parseInt(monsterSlider.value);
        monsterValue.textContent = monsterSlider.value;
    };

    // 时长按钮选择
    durBtns.forEach(btn => {
        btn.onclick = () => {
            durBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            CONFIG.gameDuration = parseInt(btn.dataset.duration) * 1000;
        };
    });

    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.onclick = () => {
            const diff = btn.dataset.difficulty;
            applyDifficulty(diff);
        };
    });

    // 虚拟按键位置选择
    posBtns.forEach(btn => {
        btn.onclick = () => {
            posBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const pos = btn.dataset.pos;
            virtualKeys.className = 'virtual-keys pos-' + pos;
        };
    });

    // 游戏模式选择
    modeBtns.forEach(btn => {
        btn.onclick = () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            CONFIG.gameMode = btn.dataset.mode;
        };
    });

    // 初始化虚拟按键显示
    virtualKeys.classList.add('pos-bottom');
    
    // 虚拟按键触摸支持
    document.querySelectorAll('.virtual-key').forEach(key => {
        const laneIndex = parseInt(key.dataset.lane);

        key.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!gameState.isPlaying || gameState.isPaused) return;
            key.classList.add('active');
            checkHit(laneIndex);
        });

        key.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            key.classList.remove('active');
        });

        key.addEventListener('mousedown', (e) => {
            if (!gameState.isPlaying || gameState.isPaused) return;
            key.classList.add('active');
            checkHit(laneIndex);
        });
        
        key.addEventListener('mouseup', () => {
            key.classList.remove('active');
        });
        
        key.addEventListener('mouseleave', () => {
            key.classList.remove('active');
        });
    });
    
    // 原键位触摸支持
    keyIndicators.forEach((indicator, index) => {
        indicator.classList.add('touch-btn');

        indicator.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!gameState.isPlaying || gameState.isPaused) return;
            indicator.classList.add('active');
            checkHit(index);
        });
        
        indicator.addEventListener('touchend', (e) => {
            e.preventDefault();
            indicator.classList.remove('active');
        });
    });
}

// 应用难度
function applyDifficulty(diff) {
    const preset = DIFFICULTY[diff];
    if (!preset) return;
    
    CONFIG.noteSpeed = preset.noteSpeed;
    CONFIG.spawnInterval = preset.spawnInterval;
    CONFIG.monsterCount = preset.monsterCount;
    if (preset.emergencyNoteDistance) CONFIG.emergencyNoteDistance = preset.emergencyNoteDistance;
    if (preset.maxIdleTimeForLane) CONFIG.maxIdleTimeForLane = preset.maxIdleTimeForLane;
    
    $('monsterSlider').value = preset.monsterCount;
    $('monsterValue').textContent = preset.monsterCount;
    
    document.querySelectorAll('.diff-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.difficulty === diff);
    });
}

// 开始游戏
function startGame() {
    $('startScreen').classList.add('hidden');
    resetGameState();
    
    // 根据游戏模式设置生命值
    if (CONFIG.gameMode === 'endless') {
        gameState.playerHealth = CONFIG.endlessHealth;
        initWaveSystem();
    } else {
        gameState.playerHealth = CONFIG.playerHealth;
    }
    
    // 显示/隐藏计时器和波次显示
    const timerStat = $('timerStat');
    const waveStat = $('waveStat');
    const monstersLeftStat = $('monstersLeftStat');
    if (CONFIG.gameMode === 'timed') {
        if (timerStat) timerStat.style.display = 'flex';
        if (waveStat) waveStat.style.display = 'none';
        if (monstersLeftStat) monstersLeftStat.style.display = 'none';
    } else {
        if (timerStat) timerStat.style.display = 'none';
        if (waveStat) waveStat.style.display = 'flex';
        if (monstersLeftStat) monstersLeftStat.style.display = 'flex';
    }
    
    // 显示虚拟按键
    const virtualKeys = $('virtualKeys');
    if (virtualKeys) virtualKeys.classList.add('show');
    
    gameState.isPlaying = true;
    gameState.startTime = Date.now();
    startMonsterSpawning();
    requestAnimationFrame(gameLoop);
}

// 初始化波次系统
function initWaveSystem() {
    gameState.currentWave = 1;
    gameState.monstersKilledInWave = 0;
    applyWaveConfig(1);
    updateWaveDisplay();
}

// 应用波次配置
function applyWaveConfig(waveNum) {
    const config = CONFIG.waveConfig[waveNum];
    if (config) {
        CONFIG.noteSpeed = config.noteSpeed;
        CONFIG.spawnInterval = config.spawnInterval;
        CONFIG.monsterCount = config.monsterCount;
        gameState.currentMonsterSpeed = config.monsterSpeed;
    } else {
        // 超过预设波次，自动递增难度
        const baseConfig = CONFIG.waveConfig[3];
        const multiplier = 1 + (waveNum - 3) * 0.1;
        CONFIG.noteSpeed = baseConfig.noteSpeed * Math.min(multiplier, 2);
        CONFIG.spawnInterval = Math.max(baseConfig.spawnInterval / multiplier, 300);
        CONFIG.monsterCount = Math.min(Math.floor(baseConfig.monsterCount * multiplier), 10);
        gameState.currentMonsterSpeed = baseConfig.monsterSpeed * Math.min(multiplier, 2);
    }
}

// 更新波次显示
function updateWaveDisplay() {
    const waveDisplay = $('waveDisplay');
    const monstersLeftDisplay = $('monstersLeftDisplay');
    if (waveDisplay) waveDisplay.textContent = gameState.currentWave;
    
    const config = CONFIG.waveConfig[gameState.currentWave];
    const monstersNeeded = config ? config.monstersToKill : Math.floor(20 * (1 + (gameState.currentWave - 3) * 0.2));
    if (monstersLeftDisplay) {
        monstersLeftDisplay.textContent = `${gameState.monstersKilledInWave}/${monstersNeeded}`;
    }
}

// 检查波次进度
function checkWaveProgress() {
    const config = CONFIG.waveConfig[gameState.currentWave];
    const monstersNeeded = config ? config.monstersToKill : Math.floor(20 * (1 + (gameState.currentWave - 3) * 0.2));
    
    if (gameState.monstersKilledInWave >= monstersNeeded) {
        nextWave();
    }
}

// 下一波
function nextWave() {
    gameState.currentWave++;
    gameState.monstersKilledInWave = 0;
    applyWaveConfig(gameState.currentWave);
    updateWaveDisplay();
    showWaveAnnouncement();
}

// 显示波次公告
function showWaveAnnouncement() {
    const announcement = $('waveAnnouncement');
    if (announcement) {
        announcement.textContent = `第 ${gameState.currentWave} 波！`;
        announcement.classList.add('show');
        setTimeout(() => announcement.classList.remove('show'), 2000);
    }
}

function resetGameState() {
    if (gameState.monsterSpawnTimer) {
        clearTimeout(gameState.monsterSpawnTimer);
        gameState.monsterSpawnTimer = null;
    }

    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.perfect = 0;
    gameState.great = 0;
    gameState.good = 0;
    gameState.miss = 0;
    gameState.playerHealth = CONFIG.playerHealth;
    gameState.notes = [];
    gameState.monsters = [];
    gameState.bullets = [];
    gameState.lastSpawnTime = 0;
    gameState.startTime = 0;
    gameState.endTime = 0;
    gameState.pausedTime = 0;
    gameState.totalPausedTime = 0;
    // 重置新增状态
    gameState.lastNoteSpawnByLane = [0, 0, 0, 0, 0];
    gameState.emergencySpawnedLanes = new Set();
    // 重置波次状态
    gameState.currentWave = 1;
    gameState.monstersKilledInWave = 0;
    gameState.currentMonsterSpeed = 1.6;
    // 重置击杀数和成就
    gameState.totalKills = 0;
    gameState.achievements = [];

    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('show');
    }

    document.querySelectorAll('.note, .monster, .bullet, .explosion').forEach(el => el.remove());
    updateDisplay();
}

// 重新开始
function restartGame() {
    $('endScreen').classList.remove('show');
    startGame();
}

function startMonsterSpawning() {
    if (!gameState.isPlaying) return;
    if (gameState.isPaused) {
        gameState.monsterSpawnTimer = setTimeout(startMonsterSpawning, 100);
        return;
    }

    if (gameState.monsters.length < CONFIG.monsterCount) {
        spawnMonster();
    }

    gameState.monsterSpawnTimer = setTimeout(startMonsterSpawning, 2000);
}

function spawnMonster() {
    const mapZone = document.querySelector('.map-zone');
    if (!mapZone) return;
    
    const laneHeight = mapZone.offsetHeight / 5;
    
    const availableLanes = [];
    for (let i = 0; i < 5; i++) {
        const hasNearbyMonster = gameState.monsters.some(m => {
            if (parseInt(m.dataset.lane) !== i) return false;
            const right = parseFloat(m.style.right);
            return right < 80;
        });
        
        if (!hasNearbyMonster) {
            availableLanes.push(i);
        }
    }
    
    if (availableLanes.length === 0) return;
    
    const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    
    const monster = document.createElement('div');
    monster.className = 'monster';
    monster.textContent = CONFIG.monsterEmojis[Math.floor(Math.random() * CONFIG.monsterEmojis.length)];
    monster.style.right = '-60px';
    monster.style.top = (laneIndex * laneHeight + laneHeight / 2) + 'px';
    monster.dataset.lane = laneIndex;
    monster.dataset.hp = '1';
    
    mapZone.appendChild(monster);
    gameState.monsters.push(monster);
}

// 游戏主循环
function gameLoop(timestamp) {
    if (!gameState.isPlaying) return;
    if (gameState.isPaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // 仅在限时模式下检查时间
    if (CONFIG.gameMode === 'timed') {
        const elapsed = Date.now() - gameState.startTime;
        const remaining = Math.max(0, Math.ceil((CONFIG.gameDuration - elapsed) / 1000));
        $('timer').textContent = remaining + 's';
        
        if (elapsed >= CONFIG.gameDuration) {
            endGame();
            return;
        }
    }

    // 检查僵尸是否接近，强制生成紧急音符
    checkEmergencyNotes();
    
    // 检查空闲轨道，定期生成音符
    checkIdleLaneNotes();

    // 生成音符
    if (timestamp - gameState.lastSpawnTime > CONFIG.spawnInterval) {
        spawnNote();
        gameState.lastSpawnTime = timestamp;
    }

    updateNotes();
    updateMonsters();
    updateBullets();
    checkCollisions();
    updateDisplay();

    requestAnimationFrame(gameLoop);
}

// 检查僵尸是否接近，需要生成紧急音符
function checkEmergencyNotes() {
    const mapZone = document.querySelector('.map-zone');
    if (!mapZone) return;
    
    const mapWidth = mapZone.offsetWidth;
    const now = Date.now();
    
    for (const monster of gameState.monsters) {
        if (!document.body.contains(monster) || monster.dataset.hp === '0') {
            continue;
        }
        
        const monsterRight = parseFloat(monster.style.right);
        const monsterLane = parseInt(monster.dataset.lane);
        
        // 计算僵尸距离玩家位置的距离（right 越大，距离越近）
        const distanceToPlayer = mapWidth - 40 - monsterRight;
        
        // 检查是否需要紧急生成音符
        if (distanceToPlayer <= CONFIG.emergencyNoteDistance) {
            // 检查该轨道是否已经有正在下落的音符
            const hasActiveNote = gameState.notes.some(note => {
                if (parseInt(note.dataset.lane) !== monsterLane || note.dataset.hit === 'true') {
                    return false;
                }
                return true;
            });
            
            // 检查该轨道是否刚刚生成过紧急音符
            const hasRecentEmergencyNote = gameState.emergencySpawnedLanes.has(monsterLane);
            
            if (!hasActiveNote && !hasRecentEmergencyNote) {
                spawnNote(monsterLane);
                gameState.emergencySpawnedLanes.add(monsterLane);
                
                // 一段时间后清除标记，允许再次紧急生成
                setTimeout(() => {
                    gameState.emergencySpawnedLanes.delete(monsterLane);
                }, 500);
            }
        }
    }
}

// 检查空闲轨道，定期生成音符
function checkIdleLaneNotes() {
    const now = Date.now();
    
    for (let laneIndex = 0; laneIndex < 5; laneIndex++) {
        const timeSinceLastSpawn = now - gameState.lastNoteSpawnByLane[laneIndex];
        
        if (timeSinceLastSpawn > CONFIG.maxIdleTimeForLane) {
            // 检查该轨道是否已经有正在下落的音符
            const hasActiveNote = gameState.notes.some(note => {
                if (parseInt(note.dataset.lane) !== laneIndex || note.dataset.hit === 'true') {
                    return false;
                }
                return true;
            });
            
            if (!hasActiveNote) {
                spawnNote(laneIndex);
            }
        }
    }
}

// 生成音符
function spawnNote(laneIndex = null) {
    // 如果没有指定轨道，随机选择
    if (laneIndex === null) {
        laneIndex = Math.floor(Math.random() * 5);
    }
    
    const note = document.createElement('div');
    note.className = 'note';
    note.style.setProperty('--note-color', CONFIG.colors[laneIndex]);
    note.style.setProperty('--note-color-dark', CONFIG.colorDarks[laneIndex]);
    note.style.top = '-60px';
    note.dataset.lane = laneIndex;
    note.dataset.y = -60;
    note.dataset.hit = 'false';
    
    tracks[laneIndex].appendChild(note);
    gameState.notes.push(note);
    
    // 更新该轨道的最后生成时间
    const now = Date.now();
    gameState.lastNoteSpawnByLane[laneIndex] = now;
    
    // 如果是紧急生成，记录一下
    return laneIndex;
}

// 更新音符
function updateNotes() {
    gameState.notes = gameState.notes.filter(note => {
        if (note.dataset.hit === 'true') return false;
        
        let y = parseFloat(note.dataset.y);
        y += CONFIG.noteSpeed;
        note.dataset.y = y;
        note.style.top = y + 'px';
        
        // 音符超出屏幕底部
        if (y > tracks[0].offsetHeight + 60) {
            showJudgment('miss');
            gameState.miss++;
            gameState.combo = 0;
            note.remove();
            return false;
        }
        return true;
    });
}

function updateMonsters() {
    const mapZone = document.querySelector('.map-zone');
    if (!mapZone) return;
    
    const newMonsters = [];
    for (const monster of gameState.monsters) {
        // 检查怪物是否已经被移除或血量为0
        if (!document.body.contains(monster) || monster.dataset.hp === '0') {
            continue;
        }
        
        let right = parseFloat(monster.style.right);
        if (isNaN(right)) right = -60;
        
        // 使用波次配置的怪物速度
        right += gameState.currentMonsterSpeed;
        monster.style.right = right + 'px';
        
        // 检查怪物是否到达玩家位置
        if (right > mapZone.offsetWidth - 40) {
            gameState.playerHealth--;
            gameState.combo = 0;
            monster.remove();
            
            showDamage();
            
            if (gameState.playerHealth <= 0) {
                gameOver();
            }
            continue;
        }
        
        newMonsters.push(monster);
    }
    gameState.monsters = newMonsters;
}

function updateBullets() {
    const mapZone = document.querySelector('.map-zone');
    if (!mapZone) return;
    
    const newBullets = [];
    for (const bullet of gameState.bullets) {
        if (!document.body.contains(bullet)) {
            continue;
        }
        
        let x = parseFloat(bullet.dataset.x);
        if (isNaN(x)) x = 0;
        
        x += 12;
        bullet.dataset.x = x;
        bullet.style.left = x + 'px';
        
        if (x > mapZone.offsetWidth) {
            bullet.remove();
            continue;
        }
        
        newBullets.push(bullet);
    }
    gameState.bullets = newBullets;
}

function checkCollisions() {
    const mapZone = document.querySelector('.map-zone');
    if (!mapZone) return;
    
    const mapWidth = mapZone.offsetWidth;
    const monsterWidth = 48;
    const monsterHeight = 48;
    
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        
        // 检查子弹是否还在DOM中
        if (!document.body.contains(bullet)) {
            gameState.bullets.splice(i, 1);
            continue;
        }
        
        const bulletLane = parseInt(bullet.dataset.lane);
        const bulletX = parseFloat(bullet.style.left);
        const bulletY = parseFloat(bullet.style.top);
        
        // 获取子弹宽度
        let bulletW = 40;
        if (bullet.classList.contains('perfect')) bulletW = 70;
        else if (bullet.classList.contains('great')) bulletW = 55;
        
        const bulletRight = bulletX + bulletW;
        
        for (let j = gameState.monsters.length - 1; j >= 0; j--) {
            const monster = gameState.monsters[j];
            
            // 检查怪物是否还在DOM中
            if (!document.body.contains(monster) || monster.dataset.hp === '0') {
                gameState.monsters.splice(j, 1);
                continue;
            }
            
            const monsterLane = parseInt(monster.dataset.lane);
            const monsterRight = parseFloat(monster.style.right);
            const monsterY = parseFloat(monster.style.top);
            
            // 计算怪物左边界（怪物从右边进来，right值越大越靠左）
            const monsterLeft = mapWidth - monsterRight - monsterWidth;
            const monsterRightEdge = mapWidth - monsterRight;
            
            if (bulletLane === monsterLane) {
                // X轴碰撞检测
                const xCollision = bulletRight > monsterLeft && bulletX < monsterRightEdge;
                // Y轴碰撞检测（都居中，间距小于一半尺寸）
                const yCollision = Math.abs(bulletY - monsterY) < (monsterHeight / 2 + 10);
                
                if (xCollision && yCollision) {
                    const hp = parseInt(monster.dataset.hp) - 1;
                    monster.dataset.hp = hp.toString();
                    
                    if (hp <= 0) {
                        const explosion = document.createElement('div');
                        explosion.className = 'explosion';
                        explosion.textContent = '💥';
                        explosion.style.right = monster.style.right;
                        explosion.style.top = monster.style.top;
                        mapZone.appendChild(explosion);
                        setTimeout(() => explosion.remove(), 400);
                        monster.remove();
                        gameState.monsters.splice(j, 1);
                        gameState.score += MONSTER_KILL_SCORE;
                        
                        // 增加总击杀数
                        gameState.totalKills++;
                        
                        // 无尽模式下增加击杀计数
                        if (CONFIG.gameMode === 'endless') {
                            gameState.monstersKilledInWave++;
                            updateWaveDisplay();
                            checkWaveProgress();
                        }
                        
                        // 检测成就
                        checkAchievements();
                    }
                    
                    bullet.remove();
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }
        }
    }
}

// 成就检测函数
function checkAchievements() {
    const achievements = [];
    
    // 击杀数量成就
    if (gameState.totalKills >= 10 && !gameState.achievements.includes('kill10')) {
        achievements.push({ id: 'kill10', text: '初战告捷 - 击杀10个怪物', icon: '⚔️' });
        gameState.achievements.push('kill10');
    }
    if (gameState.totalKills >= 50 && !gameState.achievements.includes('kill50')) {
        achievements.push({ id: 'kill50', text: '英勇无敌 - 击杀50个怪物', icon: '🗡️' });
        gameState.achievements.push('kill50');
    }
    if (gameState.totalKills >= 100 && !gameState.achievements.includes('kill100')) {
        achievements.push({ id: 'kill100', text: '怪物杀手 - 击杀100个怪物', icon: '🏆' });
        gameState.achievements.push('kill100');
    }
    
    // 连击成就
    if (gameState.maxCombo >= 50 && !gameState.achievements.includes('combo50')) {
        achievements.push({ id: 'combo50', text: '连击达人 - 50连击', icon: '🔥' });
        gameState.achievements.push('combo50');
    }
    if (gameState.maxCombo >= 100 && !gameState.achievements.includes('combo100')) {
        achievements.push({ id: 'combo100', text: '连击大师 - 100连击', icon: '💥' });
        gameState.achievements.push('combo100');
    }
    
    // 完美成就
    const totalNotes = gameState.perfect + gameState.great + gameState.good + gameState.miss;
    if (totalNotes > 50 && gameState.perfect / totalNotes >= 0.9 && !gameState.achievements.includes('perfect90')) {
        achievements.push({ id: 'perfect90', text: '完美主义 - 完美率90%+', icon: '⭐' });
        gameState.achievements.push('perfect90');
    }
    
    // 无尽模式特殊成就
    if (CONFIG.gameMode === 'endless') {
        if (gameState.currentWave >= 5 && !gameState.achievements.includes('wave5')) {
            achievements.push({ id: 'wave5', text: '挑战极限 - 突破第5波', icon: '🎯' });
            gameState.achievements.push('wave5');
        }
        if (gameState.currentWave >= 10 && !gameState.achievements.includes('wave10')) {
            achievements.push({ id: 'wave10', text: '生存专家 - 突破第10波', icon: '🏅' });
            gameState.achievements.push('wave10');
        }
    }
    
    return achievements;
}

// 暂停游戏
function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    gameState.isPaused = true;
    gameState.pausedTime = Date.now();
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.classList.add('show');
    }
}

// 恢复游戏
function resumeGame() {
    if (!gameState.isPlaying || !gameState.isPaused) return;
    const pausedDuration = Date.now() - gameState.pausedTime;
    gameState.totalPausedTime += pausedDuration;
    gameState.isPaused = false;
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('show');
    }
}

// 返回主菜单
function returnToMenu() {
    // 隐藏暂停界面
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('show');
    }
    
    // 重置游戏状态
    resetGameState();
    
    // 隐藏游戏界面，显示开始界面
    $('startScreen').classList.remove('hidden');
    
    // 隐藏虚拟按键
    const virtualKeys = $('virtualKeys');
    if (virtualKeys) virtualKeys.classList.remove('show');
}

// 按键处理
function handleKeyDown(e) {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const key = e.key.toLowerCase();
    const laneIndex = CONFIG.keys.indexOf(key);
    if (laneIndex === -1) return;

    e.preventDefault();
    keyIndicators[laneIndex].classList.add('active');
    checkHit(laneIndex);
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    const laneIndex = CONFIG.keys.indexOf(key);
    if (laneIndex === -1) return;
    keyIndicators[laneIndex].classList.remove('active');
}

// 检测击中
function checkHit(laneIndex) {
    const judgeY = tracks[laneIndex].offsetHeight - 100;
    
    const laneNotes = gameState.notes.filter(n => 
        parseInt(n.dataset.lane) === laneIndex && n.dataset.hit === 'false'
    );
    
    if (laneNotes.length === 0) return;
    
    // 找到最接近判定线的音符
    let closestNote = null;
    let closestDist = Infinity;
    
    laneNotes.forEach(note => {
        const noteY = parseFloat(note.dataset.y);
        const dist = Math.abs(noteY - judgeY);
        if (dist < closestDist) {
            closestDist = dist;
            closestNote = note;
        }
    });
    
    if (!closestNote) return;
    
    const noteY = parseFloat(closestNote.dataset.y);
    const distance = Math.abs(noteY - judgeY);
    
    let judgment = '';
    let score = 0;
    let bulletType = '';
    
    if (distance <= CONFIG.judgeThreshold.perfect) {
        judgment = 'perfect';
        score = JUDGMENT_SCORE.perfect;
        bulletType = 'perfect';
        gameState.perfect++;
        gameState.combo++;
    } else if (distance <= CONFIG.judgeThreshold.great) {
        judgment = 'great';
        score = JUDGMENT_SCORE.great;
        bulletType = ''; // great不发射子弹
        gameState.great++;
        gameState.combo++;
    } else if (distance <= CONFIG.judgeThreshold.good) {
        judgment = 'good';
        score = JUDGMENT_SCORE.good;
        bulletType = 'good';
        gameState.good++;
        gameState.combo++;
    } else {
        return;
    }
    
    const comboBonus = Math.floor(gameState.combo / 10) * 10;
    gameState.score += score + comboBonus;
    gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
    
    closestNote.dataset.hit = 'true';
    closestNote.classList.add('hit');
    setTimeout(() => closestNote.remove(), 300);
    
    // 发射子弹
    if (bulletType) {
        fireBullet(laneIndex, bulletType);
    }
    
    showJudgment(judgment);
}

// 发射子弹
function fireBullet(laneIndex, type) {
    const mapZone = document.querySelector('.map-zone');
    const laneHeight = mapZone.offsetHeight / 5;
    
    const bullet = document.createElement('div');
    bullet.className = `bullet ${type}`;
    bullet.dataset.lane = laneIndex;
    bullet.dataset.x = 0;
    bullet.style.left = '0px';
    bullet.style.top = (laneIndex * laneHeight + laneHeight / 2) + 'px';
    
    mapZone.appendChild(bullet);
    gameState.bullets.push(bullet);
}

// 显示判定
function showJudgment(type) {
    const el = $('judgment');
    el.textContent = JUDGMENT_TEXT[type];
    el.className = 'judgment ' + type;
    void el.offsetWidth;
    el.classList.add('show');
}

// 显示掉血效果
function showDamage() {
    const el = $('judgment');
    el.textContent = '💔';
    el.className = 'judgment miss';
    void el.offsetWidth;
    el.classList.add('show');
}

function calculateAccuracy() {
    const total = gameState.perfect + gameState.great + gameState.good + gameState.miss;
    if (total === 0) return 100;
    return Math.round(((gameState.perfect + gameState.great * 0.7 + gameState.good * 0.4) / total) * 100);
}

function updateDisplay() {
    const scoreEl = $('score');
    const comboEl = $('combo');
    const accuracyEl = $('accuracy');
    const healthEl = $('health');
    
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (comboEl) comboEl.textContent = gameState.combo;
    if (accuracyEl) accuracyEl.textContent = calculateAccuracy() + '%';
    if (healthEl) healthEl.textContent = '❤️'.repeat(gameState.playerHealth);
}

function endGame() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.endTime = Date.now();

    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('show');
    }
    
    // 隐藏虚拟按键
    const virtualKeys = $('virtualKeys');
    if (virtualKeys) virtualKeys.classList.remove('show');

    // 更新统计和成就
    if (gameState.currentUser) {
        updateGameEndStats();
    }

    // 限时模式保存完整游戏数据
    if (CONFIG.gameMode === 'timed' && gameState.currentUser) {
        const gameDuration = Math.floor((gameState.endTime - gameState.startTime - gameState.totalPausedTime) / 1000);
        const gameAccuracy = calculateAccuracy();
        saveScoreToLeaderboard('timed', {
            score: gameState.score,
            accuracy: gameAccuracy,
            maxCombo: gameState.maxCombo,
            totalKills: gameState.totalKills,
            perfect: gameState.perfect,
            great: gameState.great,
            good: gameState.good,
            miss: gameState.miss,
            duration: gameDuration
        });
    }

    const accuracy = calculateAccuracy();

    let grade = 'd';
    if (accuracy >= 95) grade = 's';
    else if (accuracy >= 85) grade = 'a';
    else if (accuracy >= 70) grade = 'b';
    else if (accuracy >= 50) grade = 'c';
    
    showEndScreen(grade.toUpperCase(), accuracy);
}

function gameOver() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    gameState.endTime = Date.now();

    const pauseOverlay = document.getElementById('pauseOverlay');
    if (pauseOverlay) {
        pauseOverlay.classList.remove('show');
    }
    
    // 隐藏虚拟按键
    const virtualKeys = $('virtualKeys');
    if (virtualKeys) virtualKeys.classList.remove('show');

    // 更新统计和成就
    if (gameState.currentUser) {
        updateGameEndStats();
    }

    // 无尽模式保存完整游戏数据
    if (CONFIG.gameMode === 'endless' && gameState.currentUser) {
        const gameAccuracy = calculateAccuracy();
        saveScoreToLeaderboard('endless', {
            score: gameState.score,
            accuracy: gameAccuracy,
            maxCombo: gameState.maxCombo,
            totalKills: gameState.totalKills,
            perfect: gameState.perfect,
            great: gameState.great,
            good: gameState.good,
            miss: gameState.miss,
            wave: gameState.currentWave
        });
    }

    showEndScreen('GAME OVER', null);
}

// 显示结束界面
function showEndScreen(gradeText, accuracy) {
    const gradeEl = $('grade');
    const endScreenEl = $('endScreen');
    
    if (gradeEl) {
        gradeEl.textContent = gradeText;
        gradeEl.className = 'grade ' + (gradeText === 'GAME OVER' ? 'd' : gradeText.toLowerCase());
    }
    
    // 显示详细对局信息
    updateEndScreenDetails(accuracy);
    
    // 显示排行榜
    updateLeaderboardDisplay();
    
    // 添加标签页切换功能
    initLeaderboardTabs();
    
    if (endScreenEl) endScreenEl.classList.add('show');
}

// ==================== 认证系统 ====================
function initAuthSystem() {
    const loginBtn = $('loginBtn');
    const registerBtn = $('registerBtn');
    const logoutBtn = $('logoutBtn');
    const showLeaderboardBtn = $('showLeaderboardBtn');
    const closeLeaderboardBtn = $('closeLeaderboardBtn');
    const showAchievementsBtn = $('showAchievementsBtn');
    
    // 初始化标签页切换
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.onclick = () => switchAuthTab(tab.dataset.tab);
    });
    
    if (loginBtn) loginBtn.onclick = handleLogin;
    if (registerBtn) registerBtn.onclick = handleRegister;
    if (logoutBtn) logoutBtn.onclick = handleLogout;
    if (showLeaderboardBtn) showLeaderboardBtn.onclick = showLeaderboard;
    if (showAchievementsBtn) showAchievementsBtn.onclick = showAchievements;
    if (closeLeaderboardBtn) closeLeaderboardBtn.onclick = hideLeaderboard;
    
    // 检查记住我
    checkRememberMe();
}

// 打开认证弹窗
function openAuthModal(tab = 'login') {
    // 如果游戏正在进行，暂停游戏
    if (gameState.isPlaying && !gameState.isPaused) {
        pauseGame();
    }
    $('authModal').classList.add('show');
    switchAuthTab(tab);
}

// 切换登录/注册标签
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.toggle('active', form.id === tab + 'Form');
    });
}

// 切换密码显示
function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const eyeIcon = button.querySelector('.eye-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        input.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// 忘记密码
function showForgotPassword() {
    alert('忘记密码功能开发中，请联系管理员！');
}

// 用户协议
function showTerms() {
    alert('用户协议：\n1. 请勿使用外挂\n2. 公平游戏\n3. 享受节奏打怪！');
}

// 检查记住我
function checkRememberMe() {
    const remembered = localStorage.getItem('rhythmShooterRemembered');
    if (remembered) {
        const data = JSON.parse(remembered);
        $('loginUsername').value = data.username;
        $('loginPassword').value = data.password;
        $('rememberMe').checked = true;
    }
}

// 加载用户数据
function loadUserFromStorage() {
    const savedUser = localStorage.getItem('rhythmShooterUser');
    if (savedUser) {
        gameState.currentUser = JSON.parse(savedUser);
        loadUserStats();
        updateUserDisplay();
    }
}

// 加载用户统计数据
function loadUserStats() {
    if (!gameState.currentUser) return;
    
    const statsKey = `rhythmShooterStats_${gameState.currentUser.username}`;
    const savedStats = localStorage.getItem(statsKey);
    if (savedStats) {
        gameState.userStats = JSON.parse(savedStats);
    }
}

// 保存用户统计数据
function saveUserStats() {
    if (!gameState.currentUser) return;
    
    const statsKey = `rhythmShooterStats_${gameState.currentUser.username}`;
    localStorage.setItem(statsKey, JSON.stringify(gameState.userStats));
}

function handleLogin() {
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value;
    const rememberMe = $('rememberMe').checked;
    
    if (!username || !password) {
        alert('请填写用户名和密码');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('rhythmShooterUsers') || '{}');
    
    // 支持用户名或邮箱登录
    let foundUser = null;
    for (const [user, data] of Object.entries(users)) {
        if (user === username || data.email === username) {
            if (data.password === password) {
                foundUser = user;
                break;
            }
        }
    }
    
    if (foundUser) {
        gameState.currentUser = { username: foundUser };
        localStorage.setItem('rhythmShooterUser', JSON.stringify(gameState.currentUser));
        
        // 记住密码
        if (rememberMe) {
            localStorage.setItem('rhythmShooterRemembered', JSON.stringify({
                username: foundUser,
                password: password
            }));
        } else {
            localStorage.removeItem('rhythmShooterRemembered');
        }
        
        loadUserStats();
        updateUserDisplay();
        alert('登录成功！');
        $('authModal').classList.remove('show');
        
        // 清空表单
        $('loginUsername').value = '';
        $('loginPassword').value = '';
    } else {
        alert('用户名/邮箱或密码错误');
    }
}

function handleRegister() {
    const username = $('registerUsername').value.trim();
    const email = $('registerEmail').value.trim();
    const password = $('registerPassword').value;
    const confirmPassword = $('registerConfirmPassword').value;
    const agreeTerms = $('agreeTerms').checked;
    
    if (!username || !email || !password) {
        alert('请填写所有必填项');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    if (!agreeTerms) {
        alert('请同意用户协议');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('rhythmShooterUsers') || '{}');
    
    // 检查用户名是否已存在
    if (users[username]) {
        alert('用户名已存在');
        return;
    }
    
    // 检查邮箱是否已存在
    for (const data of Object.values(users)) {
        if (data.email === email) {
            alert('邮箱已被注册');
            return;
        }
    }
    
    users[username] = { 
        password: password,
        email: email,
        createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('rhythmShooterUsers', JSON.stringify(users));
    gameState.currentUser = { username };
    localStorage.setItem('rhythmShooterUser', JSON.stringify(gameState.currentUser));
    
    // 初始化用户统计
    gameState.userStats = {
        gamesPlayed: 0,
        totalKills: 0,
        maxComboEver: 0,
        bestPerfectRate: 0,
        maxWaveEver: 0,
        bestScore: 0,
        unlockedAchievements: []
    };
    saveUserStats();
    
    updateUserDisplay();
    alert('注册成功！');
    $('authModal').classList.remove('show');
    
    // 清空表单
    $('registerUsername').value = '';
    $('registerEmail').value = '';
    $('registerPassword').value = '';
    $('registerConfirmPassword').value = '';
    $('agreeTerms').checked = false;
}

function handleLogout() {
    gameState.currentUser = null;
    localStorage.removeItem('rhythmShooterUser');
    
    // 重置用户统计
    gameState.userStats = {
        gamesPlayed: 0,
        totalKills: 0,
        maxComboEver: 0,
        bestPerfectRate: 0,
        maxWaveEver: 0,
        bestScore: 0,
        unlockedAchievements: []
    };
    
    updateUserDisplay();
}

function updateUserDisplay() {
    const userDisplay = $('userDisplay');
    const authButtons = $('authButtons');
    const userInfo = $('userInfo');
    
    if (gameState.currentUser) {
        if (userDisplay) userDisplay.textContent = gameState.currentUser.username;
        if (authButtons) authButtons.style.display = 'none';
        if (userInfo) userInfo.style.display = 'flex';
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userInfo) userInfo.style.display = 'none';
    }
}

// ==================== 成就系统 ====================
// 检查并解锁成就
function checkAchievements() {
    if (!gameState.currentUser) return;
    
    const newAchievements = [];
    
    // 更新统计
    gameState.userStats.totalKills += gameState.totalKills;
    gameState.userStats.maxComboEver = Math.max(gameState.userStats.maxComboEver, gameState.maxCombo);
    gameState.userStats.bestScore = Math.max(gameState.userStats.bestScore, gameState.score);
    
    if (CONFIG.gameMode === 'endless') {
        gameState.userStats.maxWaveEver = Math.max(gameState.userStats.maxWaveEver, gameState.currentWave);
    }
    
    // 计算完美率
    const totalNotes = gameState.perfect + gameState.great + gameState.good + gameState.miss;
    if (totalNotes > 0) {
        const perfectRate = (gameState.perfect / totalNotes) * 100;
        gameState.userStats.bestPerfectRate = Math.max(gameState.userStats.bestPerfectRate, perfectRate);
    }
    
    // 检查每个成就
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!gameState.userStats.unlockedAchievements.includes(achievement.id)) {
            if (achievement.check(gameState.userStats)) {
                gameState.userStats.unlockedAchievements.push(achievement.id);
                newAchievements.push(achievement);
                gameState.achievements.push(achievement.id);
            }
        }
    }
    
    // 显示新解锁的成就
    if (newAchievements.length > 0) {
        newAchievements.forEach((achievement, index) => {
            setTimeout(() => {
                showAchievementToast(achievement);
            }, index * 1500);
        });
    }
    
    saveUserStats();
}

// 显示成就解锁提示
function showAchievementToast(achievement) {
    const toast = $('achievementToast');
    const toastName = $('toastAchievementName');
    
    toastName.textContent = `${achievement.icon} ${achievement.name}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 显示成就页面
function showAchievements() {
    // 如果游戏正在进行，暂停游戏
    if (gameState.isPlaying && !gameState.isPaused) {
        pauseGame();
    }
    
    const achievementList = $('achievementList');
    const unlockedCount = $('unlockedCount');
    const totalCount = $('totalCount');
    
    const achievementArray = Object.values(ACHIEVEMENTS);
    const unlocked = gameState.userStats.unlockedAchievements.length;
    
    unlockedCount.textContent = unlocked;
    totalCount.textContent = achievementArray.length;
    
    achievementList.innerHTML = achievementArray.map(achievement => {
        const isUnlocked = gameState.userStats.unlockedAchievements.includes(achievement.id);
        const difficultyColors = {
            'easy': 'border-color: rgba(100, 255, 100, 0.5);',
            'medium': 'border-color: rgba(255, 255, 100, 0.5);',
            'hard': 'border-color: rgba(255, 100, 100, 0.5);',
            'legendary': 'border-color: rgba(255, 100, 255, 0.5); box-shadow: 0 0 10px rgba(255, 100, 255, 0.2);'
        };
        const style = isUnlocked ? (difficultyColors[achievement.difficulty] || '') : '';
        return `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : ''}" style="${style}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-difficulty" style="font-size: 10px; color: rgba(255,255,255,0.5); margin-top: 3px;">难度: ${achievement.difficulty}</div>
                </div>
                <div class="achievement-status">${isUnlocked ? '✓' : '🔒'}</div>
            </div>
        `;
    }).join('');
    
    $('achievementModal').classList.add('show');
}

// 更新对局结束时的成就
function updateGameEndStats() {
    if (!gameState.currentUser) return;
    
    gameState.userStats.gamesPlayed++;
    gameState.userStats.totalKills += gameState.totalKills;
    gameState.userStats.maxComboEver = Math.max(gameState.userStats.maxComboEver, gameState.maxCombo);
    gameState.userStats.bestScore = Math.max(gameState.userStats.bestScore, gameState.score);
    
    if (CONFIG.gameMode === 'endless') {
        gameState.userStats.maxWaveEver = Math.max(gameState.userStats.maxWaveEver, gameState.currentWave);
    }
    
    // 计算完美率
    const totalNotes = gameState.perfect + gameState.great + gameState.good + gameState.miss;
    if (totalNotes > 0) {
        const perfectRate = (gameState.perfect / totalNotes) * 100;
        gameState.userStats.bestPerfectRate = Math.max(gameState.userStats.bestPerfectRate, perfectRate);
    }
    
    // 检查成就
    const newAchievements = [];
    for (const [key, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!gameState.userStats.unlockedAchievements.includes(achievement.id)) {
            if (achievement.check(gameState.userStats)) {
                gameState.userStats.unlockedAchievements.push(achievement.id);
                newAchievements.push(achievement);
                gameState.achievements.push(achievement.id);
            }
        }
    }
    
    // 显示新解锁的成就
    if (newAchievements.length > 0) {
        newAchievements.forEach((achievement, index) => {
            setTimeout(() => {
                showAchievementToast(achievement);
            }, index * 1500);
        });
    }
    
    saveUserStats();
}

// 排行榜系统 - 保存分数
function saveScoreToLeaderboard(mode, gameData) {
    if (!gameState.currentUser) return;
    
    const storageKey = mode === 'timed' ? 'rhythmShooterTimedLeaderboard' : 'rhythmShooterEndlessLeaderboard';
    const leaderboard = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const existingEntry = leaderboard.find(entry => entry.username === gameState.currentUser.username);
    
    // 创建完整的游戏数据条目
    const newEntry = {
        username: gameState.currentUser.username,
        score: gameData.score,
        accuracy: gameData.accuracy,
        maxCombo: gameData.maxCombo,
        totalKills: gameData.totalKills,
        perfect: gameData.perfect,
        great: gameData.great,
        good: gameData.good,
        miss: gameData.miss,
        // 根据模式保存不同的额外数据
        ...(mode === 'timed' 
            ? { duration: gameData.duration } 
            : { wave: gameData.wave }),
        date: new Date().toISOString()
    };
    
    // 只在分数更高时更新
    if (existingEntry) {
        if (gameData.score > existingEntry.score) {
            const index = leaderboard.indexOf(existingEntry);
            leaderboard[index] = newEntry;
        }
    } else {
        leaderboard.push(newEntry);
    }
    
    // 按分数排序
    leaderboard.sort((a, b) => b.score - a.score);
    localStorage.setItem(storageKey, JSON.stringify(leaderboard.slice(0, 100)));
}

// 更新结束界面详细信息
function updateEndScreenDetails(accuracy) {
    const gameDuration = Math.floor((gameState.endTime - gameState.startTime - gameState.totalPausedTime) / 1000);
    
    $('gameModeDisplay').textContent = CONFIG.gameMode === 'timed' ? '限时模式' : '无尽模式';
    $('gameDurationDisplay').textContent = gameDuration + '秒';
    $('killCountDisplay').textContent = gameState.totalKills;
    $('waveOrLevelDisplay').textContent = CONFIG.gameMode === 'endless' ? gameState.currentWave : CONFIG.gameDuration / 1000 + '秒';
    $('finalScore').textContent = gameState.score;
    $('finalCombo').textContent = gameState.maxCombo;
    $('finalAccuracy').textContent = accuracy !== null ? accuracy + '%' : '-';
    $('finalJudgment').textContent = `${gameState.perfect}/${gameState.great}/${gameState.good}/${gameState.miss}`;
    
    // 显示成就
    const achievementsDisplay = $('achievementsDisplay');
    if (gameState.achievements.length > 0) {
        achievementsDisplay.style.display = 'block';
        const achievementsList = achievementsDisplay.querySelector('.achievements-list');
        achievementsList.innerHTML = gameState.achievements.map(id => {
            const achievementDefs = {
                'kill10': '⚔️ 初战告捷',
                'kill50': '🗡️ 英勇无敌',
                'kill100': '🏆 怪物杀手',
                'combo50': '🔥 连击达人',
                'combo100': '💥 连击大师',
                'perfect90': '⭐ 完美主义',
                'wave5': '🎯 挑战极限',
                'wave10': '🏅 生存专家'
            };
            return `<span class="achievement-tag">${achievementDefs[id] || id}</span>`;
        }).join('');
    } else {
        achievementsDisplay.style.display = 'none';
    }
}

// 更新排行榜显示
function updateLeaderboardDisplay() {
    // 显示当前游戏模式的排行榜
    const activeTab = CONFIG.gameMode === 'timed' ? 'timed' : 'endless';
    
    // 更新标签页状态
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === activeTab);
    });
    
    document.querySelectorAll('.leaderboard-container').forEach(container => {
        container.classList.toggle('active', container.id.includes(activeTab));
    });
    
    // 加载两个排行榜的数据
    loadLeaderboard('timed');
    loadLeaderboard('endless');
}

// 加载指定模式的排行榜
function loadLeaderboard(mode, suffix = '') {
    const storageKey = mode === 'timed' ? 'rhythmShooterTimedLeaderboard' : 'rhythmShooterEndlessLeaderboard';
    const leaderboard = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const tbodyId = mode === 'timed' ? `timedLeaderboardBody${suffix}` : `endlessLeaderboardBody${suffix}`;
    const tbody = $(tbodyId);
    
    if (tbody) {
        tbody.innerHTML = '';
        
        if (leaderboard.length === 0) {
            const colCount = suffix ? 9 : 8; // 弹窗有日期列，结束界面没有
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="${colCount}" style="text-align:center; padding:20px;">暂无记录</td>`;
            tbody.appendChild(row);
        } else {
            leaderboard.slice(0, 20).forEach((entry, index) => {
                const row = document.createElement('tr');
                // 为了兼容性，处理旧数据格式
                const accuracy = entry.accuracy !== undefined ? entry.accuracy + '%' : '-';
                const maxCombo = entry.maxCombo !== undefined ? entry.maxCombo : '-';
                const totalKills = entry.totalKills !== undefined ? entry.totalKills : '-';
                const perfect = entry.perfect !== undefined ? entry.perfect : '-';
                const great = entry.great !== undefined ? entry.great : '-';
                const good = entry.good !== undefined ? entry.good : '-';
                const miss = entry.miss !== undefined ? entry.miss : '-';
                const extraValue = entry.duration !== undefined ? entry.duration : (entry.wave !== undefined ? entry.wave : entry.extra);
                
                // 格式化日期
                let dateStr = '-';
                if (entry.date) {
                    const date = new Date(entry.date);
                    dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
                
                if (suffix) {
                    // 弹窗排行榜，带日期
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${entry.username}</td>
                        <td>${entry.score}</td>
                        <td>${accuracy}</td>
                        <td>${maxCombo}</td>
                        <td>${totalKills}</td>
                        <td><span class="judgment-cell">${perfect}/${great}/${good}/${miss}</span></td>
                        <td>${extraValue}${mode === 'timed' ? '秒' : ''}</td>
                        <td>${dateStr}</td>
                    `;
                } else {
                    // 结束界面排行榜
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${entry.username}</td>
                        <td>${entry.score}</td>
                        <td>${accuracy}</td>
                        <td>${maxCombo}</td>
                        <td>${totalKills}</td>
                        <td><span class="judgment-cell">${perfect}/${great}/${good}/${miss}</span></td>
                        <td>${extraValue}${mode === 'timed' ? '秒' : ''}</td>
                    `;
                }
                
                if (gameState.currentUser && entry.username === gameState.currentUser.username) {
                    row.style.backgroundColor = 'rgba(255, 0, 255, 0.2)';
                }
                tbody.appendChild(row);
            });
        }
    }
}

// 初始化排行榜标签页
function initLeaderboardTabs() {
    const tabs = document.querySelectorAll('.leaderboard-tab');
    tabs.forEach(tab => {
        tab.onclick = function() {
            const targetMode = this.dataset.tab;
            
            // 切换标签页激活状态
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 切换排行榜容器显示
            document.querySelectorAll('.leaderboard-container').forEach(container => {
                container.classList.toggle('active', container.id.includes(targetMode));
            });
        };
    });
}

// 原有的showLeaderboard函数保持向后兼容
function showLeaderboard() {
    // 如果游戏正在进行，暂停游戏
    if (gameState.isPlaying && !gameState.isPaused) {
        pauseGame();
    }
    
    // 加载两个排行榜的数据（弹窗版本）
    loadLeaderboard('timed', '-modal');
    loadLeaderboard('endless', '-modal');
    
    // 初始化标签页
    initLeaderboardTabs();
    
    // 默认显示当前游戏模式的排行榜
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === CONFIG.gameMode);
    });
    
    document.querySelectorAll('.leaderboard-container').forEach(container => {
        container.classList.toggle('active', container.id.includes(CONFIG.gameMode));
    });
    
    $('leaderboardModal').classList.add('show');
}

function hideLeaderboard() {
    $('leaderboardModal').classList.remove('show');
}

// 启动游戏
init();
