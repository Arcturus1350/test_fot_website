// 抽奖系统核心逻辑

class LotterySystem {
    constructor() {
        this.prizeManager = new PrizeManager();
        this.isDrawing = false;
        this.drawHistory = Storage.get('drawHistory', []);
        this.userResources = this.initUserResources();
        this.firstTenDrawUsed = Storage.get('firstTenDrawUsed', false);
    }

    // 初始化用户资源
    initUserResources() {
        return {
            drawTickets: Storage.get('drawTickets', 10),
            vBeans: Storage.get('vBeans', 100)
        };
    }

    // 保存用户资源
    saveUserResources() {
        Storage.set('drawTickets', this.userResources.drawTickets);
        Storage.set('vBeans', this.userResources.vBeans);
    }

    // 更新界面显示的资源数量
    updateResourceDisplay() {
        const drawTicketsElement = document.getElementById('drawTickets');
        const vBeansElement = document.getElementById('vBeans');
        const pityCounterElement = document.getElementById('pityCounter');

        if (drawTicketsElement) {
            drawTicketsElement.textContent = this.userResources.drawTickets;
        }
        if (vBeansElement) {
            vBeansElement.textContent = this.userResources.vBeans;
        }
        if (pityCounterElement) {
            pityCounterElement.textContent = this.prizeManager.getPityDistance();
        }

        // 更新十连抽消耗显示
        this.updateTenDrawCost();
    }

    // 更新十连抽消耗显示
    updateTenDrawCost() {
        const tenDrawCostElement = document.getElementById('tenDrawCost');
        if (tenDrawCostElement) {
            const cost = this.firstTenDrawUsed ? 10 : 7;
            tenDrawCostElement.textContent = `消耗: ${cost}次`;
        }
    }

    // 验证抽奖条件
    validateDraw(type) {
        if (this.isDrawing) {
            DOMUtils.showToast('抽奖正在进行中，请稍候', 'warning');
            return false;
        }

        if (!TimeUtils.isInActivityTime()) {
            DOMUtils.showToast('活动已结束', 'error');
            return false;
        }

        const requiredTickets = this.getRequiredTickets(type);
        if (!ValidationUtils.validateDrawTickets(requiredTickets, this.userResources.drawTickets)) {
            DOMUtils.showToast('抽奖次数不足', 'error');
            return false;
        }

        return true;
    }

    // 获取所需抽奖次数
    getRequiredTickets(type) {
        if (type === 'single') {
            return 1;
        } else if (type === 'ten') {
            return this.firstTenDrawUsed ? 10 : 7;
        }
        return 1;
    }

    // 执行单次抽奖
    async drawSingle() {
        if (!this.validateDraw('single')) return;

        this.isDrawing = true;
        this.setDrawingState(true);

        try {
            // 消耗抽奖次数
            this.userResources.drawTickets -= 1;
            this.saveUserResources();

            // 快速响应，立即执行抽奖
            await this.delay(100);

            // 执行抽奖
            const result = this.prizeManager.drawOnce();
            
            // 处理奖品
            this.processPrize(result);
            
            // 添加到历史记录
            this.addToHistory([result]);
            
            // 显示结果
            this.showDrawResult([result], 'single');
            
        } catch (error) {
            console.error('抽奖失败:', error);
            DOMUtils.showToast('抽奖失败，请重试', 'error');
            // 退还抽奖次数
            this.userResources.drawTickets += 1;
            this.saveUserResources();
        } finally {
            this.isDrawing = false;
            this.setDrawingState(false);
            this.updateResourceDisplay();
        }
    }

    // 执行十连抽
    async drawTen() {
        if (!this.validateDraw('ten')) return;

        this.isDrawing = true;
        this.setDrawingState(true);

        try {
            const requiredTickets = this.getRequiredTickets('ten');
            
            // 消耗抽奖次数
            this.userResources.drawTickets -= requiredTickets;
            this.saveUserResources();

            // 快速响应，立即执行抽奖
            await this.delay(150);

            // 执行十连抽
            const results = this.prizeManager.drawTen();
            
            // 处理奖品
            results.forEach(result => this.processPrize(result));
            
            // 标记首次十连抽已使用
            if (!this.firstTenDrawUsed) {
                this.firstTenDrawUsed = true;
                Storage.set('firstTenDrawUsed', true);
            }
            
            // 添加到历史记录
            this.addToHistory(results);
            
            // 显示结果
            this.showDrawResult(results, 'ten');
            
        } catch (error) {
            console.error('十连抽失败:', error);
            DOMUtils.showToast('十连抽失败，请重试', 'error');
            // 退还抽奖次数
            const requiredTickets = this.getRequiredTickets('ten');
            this.userResources.drawTickets += requiredTickets;
            this.saveUserResources();
        } finally {
            this.isDrawing = false;
            this.setDrawingState(false);
            this.updateResourceDisplay();
        }
    }

    // 处理奖品（添加到用户资源）
    processPrize(prize) {
        // 添加V豆奖励（仅蓝色和绿色品质）
        if (prize.amount && (prize.quality === 'blue' || prize.quality === 'green')) {
            this.userResources.vBeans += prize.amount;
        }
        
        // 金色和紫色奖品需要单独领取，不直接添加V豆
        if (prize.quality === 'gold') {
            // 金色奖品添加到待领取列表
            this.addGoldPrizeToInventory(prize);
        }
    }

    // 添加金色奖品到背包
    addGoldPrizeToInventory(prize) {
        let goldInventory = Storage.get('goldInventory', []);
        const inventoryItem = {
            id: StringUtils.generateId(),
            prizeId: prize.id,
            name: prize.name,
            icon: prize.icon,
            description: prize.description,
            timestamp: TimeUtils.now(),
            claimed: false
        };
        goldInventory.unshift(inventoryItem);
        Storage.set('goldInventory', goldInventory);
    }

    // 设置抽奖状态
    setDrawingState(isDrawing) {
        const singleBtn = document.getElementById('singleDraw');
        const tenBtn = document.getElementById('tenDraw');

        if (singleBtn) {
            singleBtn.disabled = isDrawing;
            if (isDrawing) {
                singleBtn.classList.add('drawing');
                singleBtn.querySelector('.btn-text').textContent = '抽奖中...';
            } else {
                singleBtn.classList.remove('drawing');
                singleBtn.querySelector('.btn-text').textContent = '单抽';
            }
        }

        if (tenBtn) {
            tenBtn.disabled = isDrawing;
            if (isDrawing) {
                tenBtn.classList.add('drawing');
                tenBtn.querySelector('.btn-text').textContent = '抽奖中...';
            } else {
                tenBtn.classList.remove('drawing');
                tenBtn.querySelector('.btn-text').textContent = '十连抽';
            }
        }
    }

    // 显示抽奖结果
    showDrawResult(results, type) {
        // 使用新的抽卡动画系统
        if (window.showCardDrawAnimation) {
            const drawType = type === 'ten' ? 'multi' : 'single';
            window.showCardDrawAnimation(results, drawType);
        } else {
            // 兼容性处理：如果抽卡动画不可用，则使用原始弹窗
            const modal = document.getElementById('resultModal');
            const resultDisplay = document.getElementById('resultDisplay');
            
            if (!modal || !resultDisplay) return;

            // 清空之前的内容
            resultDisplay.innerHTML = '';

            // 创建结果项目
            const itemsContainer = this.createResultItems(results);
            resultDisplay.appendChild(itemsContainer);

            // 显示模态框
            modal.classList.add('show');
        }
    }



    // 创建结果项目
    createResultItems(results) {
        const container = document.createElement('div');
        container.className = 'result-items';

        results.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = `result-item ${result.quality}`;

            const quality = document.createElement('div');
            quality.className = `result-quality ${result.quality}`;
            quality.textContent = this.getQualityName(result.quality);

            const icon = document.createElement('div');
            icon.className = 'result-icon';
            icon.textContent = result.icon;

            const name = document.createElement('div');
            name.className = 'result-name';
            name.textContent = result.name;

            const amount = document.createElement('div');
            amount.className = 'result-amount';
            if (result.amount) {
                amount.textContent = `x${result.amount}`;
            } else if (result.vBeanBonus) {
                amount.textContent = `+${result.vBeanBonus}V豆`;
            }

            item.appendChild(quality);
            item.appendChild(icon);
            item.appendChild(name);
            item.appendChild(amount);

            container.appendChild(item);
        });

        return container;
    }



    // 获取品质名称
    getQualityName(quality) {
        const qualityNames = {
            [QUALITY.GOLD]: '金色',
            [QUALITY.PURPLE]: '紫色',
            [QUALITY.BLUE]: '蓝色',
            [QUALITY.GREEN]: '绿色'
        };
        return qualityNames[quality] || '未知';
    }

    // 添加到历史记录（拆分为单独记录）
    addToHistory(results) {
        const timestamp = TimeUtils.now();
        
        // 将每个奖品作为单独的历史记录
        results.forEach((result, index) => {
            const historyRecord = {
                id: StringUtils.generateId(),
                timestamp: timestamp + index, // 稍微调整时间戳以区分顺序
                prize: {
                    name: result.name,
                    icon: result.icon,
                    quality: result.quality,
                    amount: result.amount,
                    description: result.description
                }
            };
            
            this.drawHistory.unshift(historyRecord);
        });
        
        // 保持历史记录数量不超过1000条
        if (this.drawHistory.length > 1000) {
            this.drawHistory = this.drawHistory.slice(0, 1000);
        }

        Storage.set('drawHistory', this.drawHistory);
    }

    // 获取历史记录
    getHistory() {
        return this.drawHistory;
    }

    // V豆兑换抽奖次数（已移至App类中处理）

    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 重置所有数据（仅用于测试）
    resetAllData() {
        if (confirm('确定要重置所有数据吗？这将清除所有抽奖记录和统计信息。')) {
            // 重置奖品管理器
            this.prizeManager.resetStatistics();
            
            // 重置用户资源
            this.userResources = {
                drawTickets: 10,
                vBeans: 100
            };
            this.saveUserResources();
            
            // 重置历史记录
            this.drawHistory = [];
            Storage.set('drawHistory', []);
            
            // 重置其他状态
            this.firstTenDrawUsed = false;
            Storage.remove('firstTenDrawUsed');
            
            // 更新显示
            this.updateResourceDisplay();
            
            DOMUtils.showToast('数据已重置', 'success');
        }
    }
}

// 导出到全局
window.LotterySystem = LotterySystem; 