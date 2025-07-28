// 奖品管理系统

// 奖品品质枚举
const QUALITY = {
    GOLD: 'gold',
    PURPLE: 'purple',
    BLUE: 'blue',
    GREEN: 'green'
};

// 奖品类型定义
const PRIZE_TYPES = {
    // 金色品质
    VPS_MONTHLY: {
        id: 'vps_monthly',
        name: 'VPS月卡',
        quality: QUALITY.GOLD,
        icon: '👑',
        description: 'VPS服务月卡会员'
    },
    VPS_YEARLY: {
        id: 'vps_yearly',
        name: 'VPS年卡',
        quality: QUALITY.GOLD,
        icon: '🌟',
        description: 'VPS服务年卡会员'
    },
    
    // 紫色品质
    CASH_5: {
        id: 'cash_5',
        name: '现金红包5元',
        quality: QUALITY.PURPLE,
        icon: '💰',
        description: '5元现金红包',
        amount: 5
    },
    CASH_10: {
        id: 'cash_10',
        name: '现金红包10元',
        quality: QUALITY.PURPLE,
        icon: '💸',
        description: '10元现金红包',
        amount: 10
    },
    
    // 蓝色品质
    VBEAN_50: {
        id: 'vbean_50',
        name: 'V豆x50',
        quality: QUALITY.BLUE,
        icon: '💎',
        description: '50个V豆',
        amount: 50
    },
    VBEAN_99: {
        id: 'vbean_99',
        name: 'V豆x99',
        quality: QUALITY.BLUE,
        icon: '💎',
        description: '99个V豆',
        amount: 99
    },

    
    // 绿色品质 - 动态生成
    VBEAN_SMALL: {
        id: 'vbean_small',
        name: 'V豆',
        quality: QUALITY.GREEN,
        icon: '⚡',
        description: '1-49个V豆',
        amountRange: [1, 49]
    }
};

// 抽奖概率配置
const DRAW_PROBABILITIES = {
    // 基础概率
    BASE: {
        [QUALITY.GOLD]: 0.015,      // 1.5%
        [QUALITY.PURPLE]: 0.085,    // 8.5%
        [QUALITY.BLUE]: 0.40,       // 40%
        [QUALITY.GREEN]: 0.50       // 50%
    },
    
    // 保底配置
    PITY: {
        GOLD_GUARANTEE: 70,          // 70次保底
        EARLY_GOLD_GUARANTEE: 30,    // 前30次保底
        GOLD_RATE_UP_START: 60       // 60次后开始提升概率
    }
};

// 奖品管理器
class PrizeManager {
    constructor() {
        this.lastGoldType = null; // 记录上次获得的金色奖品类型
        this.drawCount = Storage.get('drawCount', 0);
        this.totalDrawCount = Storage.get('totalDrawCount', 0);
        this.goldCount = Storage.get('goldCount', 0);
        this.lastGoldDraw = Storage.get('lastGoldDraw', 0);
    }

    // 计算金色品质概率（含保底）
    calculateGoldProbability() {
        const sinceLastGold = this.drawCount - this.lastGoldDraw;
        
        // 保底逻辑
        if (sinceLastGold >= DRAW_PROBABILITIES.PITY.GOLD_GUARANTEE) {
            return 1.0; // 100%必出
        }
        
        // 前30次保底
        if (this.totalDrawCount < DRAW_PROBABILITIES.PITY.EARLY_GOLD_GUARANTEE && this.goldCount === 0) {
            if (this.totalDrawCount >= 29) { // 第30次必出
                return 1.0;
            }
        }
        
        // 概率提升
        if (sinceLastGold >= DRAW_PROBABILITIES.PITY.GOLD_RATE_UP_START) {
            const extraRateUp = (sinceLastGold - DRAW_PROBABILITIES.PITY.GOLD_RATE_UP_START) * 0.1;
            return Math.min(DRAW_PROBABILITIES.BASE[QUALITY.GOLD] + extraRateUp, 0.5);
        }
        
        return DRAW_PROBABILITIES.BASE[QUALITY.GOLD];
    }

    // 执行单次抽奖
    drawOnce() {
        this.drawCount++;
        this.totalDrawCount++;
        
        const goldProb = this.calculateGoldProbability();
        const random = MathUtils.random();
        
        let quality;
        
        // 确定品质
        if (random < goldProb) {
            quality = QUALITY.GOLD;
            this.goldCount++;
            this.lastGoldDraw = this.drawCount;
        } else if (random < goldProb + DRAW_PROBABILITIES.BASE[QUALITY.PURPLE]) {
            quality = QUALITY.PURPLE;
        } else if (random < goldProb + DRAW_PROBABILITIES.BASE[QUALITY.PURPLE] + DRAW_PROBABILITIES.BASE[QUALITY.BLUE]) {
            quality = QUALITY.BLUE;
        } else {
            quality = QUALITY.GREEN;
        }
        
        // 根据品质生成具体奖品
        const prize = this.generatePrizeByQuality(quality);
        
        // 保存统计数据
        this.saveStatistics();
        
        return prize;
    }

    // 根据品质生成具体奖品
    generatePrizeByQuality(quality) {
        const prize = {
            id: StringUtils.generateId(),
            quality: quality,
            timestamp: TimeUtils.now()
        };

        switch (quality) {
            case QUALITY.GOLD:
                return this.generateGoldPrize(prize);
            case QUALITY.PURPLE:
                return this.generatePurplePrize(prize);
            case QUALITY.BLUE:
                return this.generateBluePrize(prize);
            case QUALITY.GREEN:
                return this.generateGreenPrize(prize);
            default:
                return this.generateGreenPrize(prize);
        }
    }

    // 生成金色品质奖品
    generateGoldPrize(basePrize) {
        let prizeType;
        
        // 月卡年卡交替逻辑
        if (this.lastGoldType === null) {
            // 首次金色品质，65%月卡，35%年卡
            prizeType = MathUtils.random() < 0.65 ? PRIZE_TYPES.VPS_MONTHLY : PRIZE_TYPES.VPS_YEARLY;
        } else if (this.lastGoldType === 'vps_monthly') {
            // 上次是月卡，这次必定年卡
            prizeType = PRIZE_TYPES.VPS_YEARLY;
        } else {
            // 上次是年卡，65%月卡，35%年卡
            prizeType = MathUtils.random() < 0.65 ? PRIZE_TYPES.VPS_MONTHLY : PRIZE_TYPES.VPS_YEARLY;
        }
        
        this.lastGoldType = prizeType.id;
        Storage.set('lastGoldType', this.lastGoldType);
        
        return {
            ...basePrize,
            ...prizeType
        };
    }

    // 生成紫色品质奖品
    generatePurplePrize(basePrize) {
        // 70%概率5元，30%概率10元
        const prizeType = MathUtils.random() < 0.7 ? PRIZE_TYPES.CASH_5 : PRIZE_TYPES.CASH_10;
        
        return {
            ...basePrize,
            ...prizeType
        };
    }

    // 生成蓝色品质奖品
    generateBluePrize(basePrize) {
        const blueTypes = [PRIZE_TYPES.VBEAN_50, PRIZE_TYPES.VBEAN_99];
        const weights = [0.6, 0.4]; // 60%, 40%
        const selectedIndex = MathUtils.weightedRandom(weights);
        const prizeType = blueTypes[selectedIndex];
        
        return {
            ...basePrize,
            ...prizeType
        };
    }

    // 生成绿色品质奖品
    generateGreenPrize(basePrize) {
        const amount = MathUtils.randomInt(1, 49);
        
        return {
            ...basePrize,
            ...PRIZE_TYPES.VBEAN_SMALL,
            name: `V豆x${amount}`,
            description: `${amount}个V豆`,
            amount: amount
        };
    }

    // 执行十连抽
    drawTen() {
        const results = [];
        for (let i = 0; i < 10; i++) {
            results.push(this.drawOnce());
        }
        return results;
    }

    // 保存统计数据
    saveStatistics() {
        Storage.set('drawCount', this.drawCount);
        Storage.set('totalDrawCount', this.totalDrawCount);
        Storage.set('goldCount', this.goldCount);
        Storage.set('lastGoldDraw', this.lastGoldDraw);
    }

    // 获取保底距离
    getPityDistance() {
        return Math.max(0, DRAW_PROBABILITIES.PITY.GOLD_GUARANTEE - (this.drawCount - this.lastGoldDraw));
    }

    // 重置统计数据（测试用）
    resetStatistics() {
        this.drawCount = 0;
        this.totalDrawCount = 0;
        this.goldCount = 0;
        this.lastGoldDraw = 0;
        this.lastGoldType = null;
        
        Storage.remove('drawCount');
        Storage.remove('totalDrawCount');
        Storage.remove('goldCount');
        Storage.remove('lastGoldDraw');
        Storage.remove('lastGoldType');
    }

    // 获取奖品统计信息
    getStatistics() {
        return {
            totalDraws: this.totalDrawCount,
            goldCount: this.goldCount,
            pityDistance: this.getPityDistance(),
            goldRate: this.totalDrawCount > 0 ? (this.goldCount / this.totalDrawCount * 100).toFixed(2) : 0
        };
    }
}

// 导出到全局
window.QUALITY = QUALITY;
window.PRIZE_TYPES = PRIZE_TYPES;
window.DRAW_PROBABILITIES = DRAW_PROBABILITIES;
window.PrizeManager = PrizeManager; 