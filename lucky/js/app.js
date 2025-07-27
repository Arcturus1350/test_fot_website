// 主应用程序

class App {
    constructor() {
        this.lotterySystem = null;
        this.currentTab = 'exchange';
        this.selectedExchangeItem = null;
        this.currentClaimingPrize = null;
        this.currentHistoryPage = 1;
        this.historyPerPage = 10;
        this.selectedRechargeAmount = null;
        this.selectedRechargeTier = null;
        this.selectedRechargePrice = null;
        this.init();
    }

    // 初始化应用
    async init() {
        try {
            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
            } else {
                this.onDOMReady();
            }
        } catch (error) {
            console.error('应用初始化失败:', error);
            DOMUtils.showToast('应用初始化失败', 'error');
        }
    }

    // DOM准备就绪
    onDOMReady() {
        console.log('抽奖应用启动中...');
        
        // 初始化抽奖系统
        this.lotterySystem = new LotterySystem();
        
        // 绑定事件监听器
        this.bindEventListeners();
        
        // 初始化界面
        this.initializeUI();
        
        // 检查活动状态
        this.checkActivityStatus();
        
        console.log('抽奖应用启动完成');
        DOMUtils.showToast('欢迎参与VPS回馈用户抽奖活动！', 'info');
    }

    // 绑定事件监听器
    bindEventListeners() {
        // 抽奖按钮
        this.bindDrawButtons();
        
        // 标签页切换
        this.bindTabSwitching();
        
        // V豆兑换
        this.bindExchangeFunction();
        
        // 抽奖结果模态框
        this.bindResultModal();
        
        // 分享功能
        this.bindShareFunction();
        
        // 键盘快捷键
        this.bindKeyboardShortcuts();
        
        // 资源加号按钮
        this.bindResourceAddButtons();
        
        // 充值弹窗
        this.bindRechargeModal();
    }

    // 绑定抽奖按钮事件
    bindDrawButtons() {
        const singleDrawBtn = document.getElementById('singleDraw');
        const tenDrawBtn = document.getElementById('tenDraw');

        if (singleDrawBtn) {
            singleDrawBtn.addEventListener('click', () => {
                this.lotterySystem.drawSingle();
            });
        }

        if (tenDrawBtn) {
            tenDrawBtn.addEventListener('click', () => {
                this.lotterySystem.drawTen();
            });
        }
    }

    // 绑定标签页切换
    bindTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    // 切换标签页
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新面板显示
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // 根据标签页加载内容
        this.loadTabContent(tabName);
    }

    // 加载标签页内容
    loadTabContent(tabName) {
        switch (tabName) {
            case 'exchange':
                this.loadGoldPrizeContent();
                break;
            case 'history':
                this.loadHistoryContent();
                break;
            case 'share':
                this.loadShareContent();
                break;
        }
    }

    // 加载历史记录内容
    loadHistoryContent() {
        const historyGrid = document.getElementById('historyGrid');
        const emptyHistory = document.getElementById('emptyHistory');
        const totalDrawCount = document.getElementById('totalDrawCount');
        const goldCount = document.getElementById('goldCount');
        
        if (!historyGrid) return;

        const history = this.lotterySystem.getHistory();
        
        // 更新统计信息
        if (totalDrawCount) totalDrawCount.textContent = history.length;
        if (goldCount) {
            const goldRecords = history.filter(record => record.prize.quality === 'gold');
            goldCount.textContent = goldRecords.length;
        }
        
        if (history.length === 0) {
            historyGrid.style.display = 'none';
            emptyHistory.style.display = 'block';
            this.updatePagination(0, 0);
            return;
        }

        historyGrid.style.display = 'grid';
        emptyHistory.style.display = 'none';
        
        this.displayHistoryPage();
        this.bindHistoryPagination();
    }

    // 显示历史记录页面
    displayHistoryPage() {
        const historyGrid = document.getElementById('historyGrid');
        const history = this.lotterySystem.getHistory();
        
        const totalPages = Math.ceil(history.length / this.historyPerPage);
        const startIndex = (this.currentHistoryPage - 1) * this.historyPerPage;
        const endIndex = startIndex + this.historyPerPage;
        const pageHistory = history.slice(startIndex, endIndex);
        
        historyGrid.innerHTML = '';
        
        pageHistory.forEach(record => {
            const recordElement = this.createHistoryRecord(record);
            historyGrid.appendChild(recordElement);
        });
        
        this.updatePagination(this.currentHistoryPage, totalPages);
    }

    // 创建历史记录项
    createHistoryRecord(recordData) {
        const record = document.createElement('div');
        record.className = `history-record ${recordData.prize.quality}`;

        const timeString = TimeUtils.formatTimestamp(recordData.timestamp, 'MM-DD HH:mm:ss');
        
        record.innerHTML = `
            <div class="record-time">${timeString}</div>
            <div class="record-prize">
                <div class="record-icon">${recordData.prize.icon}</div>
                <div class="record-info">
                    <div class="record-name">${recordData.prize.name}</div>
                    <div class="record-amount">${recordData.prize.amount ? `x${recordData.prize.amount}` : ''}</div>
                </div>
            </div>
        `;

        return record;
    }

    // 绑定历史记录翻页功能
    bindHistoryPagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) {
            prevBtn.onclick = () => {
                if (this.currentHistoryPage > 1) {
                    this.currentHistoryPage--;
                    this.displayHistoryPage();
                }
            };
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => {
                const history = this.lotterySystem.getHistory();
                const totalPages = Math.ceil(history.length / this.historyPerPage);
                if (this.currentHistoryPage < totalPages) {
                    this.currentHistoryPage++;
                    this.displayHistoryPage();
                }
            };
        }
    }

    // 更新分页信息
    updatePagination(currentPage, totalPages) {
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (pageInfo) {
            pageInfo.textContent = totalPages > 0 ? `第 ${currentPage} 页，共 ${totalPages} 页` : '暂无记录';
        }
        
        if (prevBtn) {
            prevBtn.disabled = currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = currentPage >= totalPages;
        }
    }

    // 切换标签页时重置历史记录分页
    switchTab(tabName) {
        // 更新按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新面板显示
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // 重置历史记录分页
        if (tabName === 'history') {
            this.currentHistoryPage = 1;
        }

        // 根据标签页加载内容
        this.loadTabContent(tabName);
    }

    // 绑定V豆兑换功能
    bindExchangeFunction() {
        // 绑定商品选择按钮
        this.bindExchangeButtons();

        // 绑定兑换确认弹窗
        this.bindExchangeModal();
        
        // 绑定CDK弹窗
        this.bindCdkModal();
    }

    // 绑定兑换按钮（需要动态绑定，因为金色奖品是动态生成的）
    bindExchangeButtons() {
        // 使用事件委托处理动态生成的按钮
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('item-select-btn')) {
                const item = e.target.closest('.exchange-item');
                if (item && !item.classList.contains('disabled')) {
                    if (item.classList.contains('gold-prize-item')) {
                        // 金色奖品领取
                        this.claimGoldPrize(item);
                    } else {
                        // 普通V豆兑换
                        this.openExchangeModal(item);
                    }
                }
            }
        });
    }

    // 绑定兑换确认弹窗
    bindExchangeModal() {
        const modal = document.getElementById('exchangeModal');
        const closeBtn = modal?.querySelector('.close-btn');
        const cancelBtn = document.getElementById('cancelExchange');
        const confirmBtn = document.getElementById('confirmExchange');
        const quantityInput = document.getElementById('exchangeQuantity');
        const decreaseBtn = document.getElementById('decreaseBtn');
        const increaseBtn = document.getElementById('increaseBtn');

        // 关闭按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeExchangeModal();
            });
        }

        // 取消按钮
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeExchangeModal();
            });
        }

        // 确认兑换按钮
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmExchange();
            });
        }

        // 数量控制
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                this.adjustQuantity(-1);
            });
        }

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                this.adjustQuantity(1);
            });
        }

        // 数量输入变化
        if (quantityInput) {
            quantityInput.addEventListener('input', () => {
                this.updateExchangeSummary();
            });

            quantityInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn?.click();
                }
            });
        }

        // 点击背景关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeExchangeModal();
                }
            });
        }
    }

    // 打开兑换确认弹窗
    openExchangeModal(itemElement) {
        const modal = document.getElementById('exchangeModal');
        if (!modal) return;

        // 获取商品信息
        const type = itemElement.getAttribute('data-type');
        const cost = parseInt(itemElement.getAttribute('data-cost'));
        const reward = parseInt(itemElement.getAttribute('data-reward'));
        
        const icon = itemElement.querySelector('.item-icon').textContent;
        const name = itemElement.querySelector('.item-name').textContent;
        const description = itemElement.querySelector('.item-description').textContent;

        // 保存当前选择的商品信息
        this.selectedExchangeItem = {
            type,
            cost,
            reward,
            icon,
            name,
            description
        };

        // 更新弹窗内容
        document.getElementById('selectedItemIcon').textContent = icon;
        document.getElementById('selectedItemName').textContent = name;
        document.getElementById('selectedItemDescription').textContent = description;
        document.getElementById('selectedItemCost').innerHTML = `<span class="unit-cost">${cost} V豆/个</span>`;

        // 重置数量
        document.getElementById('exchangeQuantity').value = 1;
        
        // 更新用户资源显示
        document.getElementById('currentVBeans').textContent = this.lotterySystem.userResources.vBeans;
        
        // 更新摘要
        this.updateExchangeSummary();

        // 显示弹窗
        modal.classList.add('show');
    }

    // 关闭兑换确认弹窗
    closeExchangeModal() {
        const modal = document.getElementById('exchangeModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.selectedExchangeItem = null;
    }

    // 调整数量
    adjustQuantity(delta) {
        const quantityInput = document.getElementById('exchangeQuantity');
        if (!quantityInput) return;

        let currentValue = parseInt(quantityInput.value) || 1;
        let newValue = currentValue + delta;
        
        // 限制范围
        newValue = Math.max(1, Math.min(999, newValue));
        
        // 检查V豆是否足够
        if (this.selectedExchangeItem) {
            const totalCost = newValue * this.selectedExchangeItem.cost;
            const maxAffordable = Math.floor(this.lotterySystem.userResources.vBeans / this.selectedExchangeItem.cost);
            newValue = Math.min(newValue, maxAffordable);
        }

        quantityInput.value = newValue;
        this.updateExchangeSummary();
    }

    // 更新兑换摘要
    updateExchangeSummary() {
        if (!this.selectedExchangeItem) return;

        const quantity = parseInt(document.getElementById('exchangeQuantity').value) || 1;
        const totalCost = quantity * this.selectedExchangeItem.cost;
        const remainingVBeans = this.lotterySystem.userResources.vBeans - totalCost;

        // 更新显示
        document.getElementById('summaryQuantity').textContent = `${quantity}个`;
        document.getElementById('summaryTotalCost').textContent = totalCost;
        document.getElementById('summaryRemainingVBeans').textContent = Math.max(0, remainingVBeans);

        // 更新确认按钮状态
        const confirmBtn = document.getElementById('confirmExchange');
        if (confirmBtn) {
            if (totalCost > this.lotterySystem.userResources.vBeans) {
                confirmBtn.disabled = true;
                confirmBtn.textContent = 'V豆不足';
                confirmBtn.style.opacity = '0.5';
            } else {
                confirmBtn.disabled = false;
                confirmBtn.textContent = '确认兑换';
                confirmBtn.style.opacity = '1';
            }
        }
    }

    // 确认兑换
    confirmExchange() {
        if (!this.selectedExchangeItem) return;

        const quantity = parseInt(document.getElementById('exchangeQuantity').value) || 1;
        const totalCost = quantity * this.selectedExchangeItem.cost;
        const totalReward = quantity * this.selectedExchangeItem.reward;

        // 验证V豆是否足够
        if (totalCost > this.lotterySystem.userResources.vBeans) {
            DOMUtils.showToast('V豆不足', 'error');
            return;
        }

        // 执行兑换
        if (this.selectedExchangeItem.type === 'draw-ticket') {
            this.lotterySystem.userResources.vBeans -= totalCost;
            this.lotterySystem.userResources.drawTickets += totalReward;
            this.lotterySystem.saveUserResources();
            this.lotterySystem.updateResourceDisplay();

            DOMUtils.showToast(`成功兑换${totalReward}次抽奖机会`, 'success');
            this.closeExchangeModal();
        }
    }

    // 加载金色奖品内容
    loadGoldPrizeContent() {
        const goldPrizeItems = document.getElementById('goldPrizeItems');
        const noPrizes = document.getElementById('noGoldPrizes');
        
        if (!goldPrizeItems) return;

        const goldInventory = Storage.get('goldInventory', []);
        
        if (goldInventory.length === 0) {
            goldPrizeItems.style.display = 'none';
            noPrizes.style.display = 'block';
            return;
        }

        goldPrizeItems.style.display = 'flex';
        goldPrizeItems.className = 'exchange-items member-cards';
        noPrizes.style.display = 'none';
        
        goldPrizeItems.innerHTML = '';
        
        // 按时间倒序显示（最新的在前）
        const sortedPrizes = goldInventory.sort((a, b) => b.timestamp - a.timestamp);
        
        sortedPrizes.forEach(prize => {
            const prizeElement = this.createGoldPrizeElement(prize);
            goldPrizeItems.appendChild(prizeElement);
        });
    }

    // 创建金色奖品元素
    createGoldPrizeElement(prize) {
        const element = document.createElement('div');
        const isClaimed = prize.claimed;
        element.className = `exchange-item gold-prize-item${isClaimed ? ' claimed' : ''}`;
        element.setAttribute('data-prize-id', prize.id);
        
        const obtainTime = TimeUtils.formatTimestamp(prize.timestamp, 'MM-DD HH:mm');
        const claimTime = prize.claimedAt ? TimeUtils.formatTimestamp(prize.claimedAt, 'MM-DD HH:mm') : null;
        
        const timeDisplay = isClaimed ? 
            `获得时间：${obtainTime} | 领取时间：${claimTime}` : 
            `获得时间：${obtainTime}`;
        
        const buttonText = isClaimed ? '已领取' : '领取';
        const statusDisplay = isClaimed ? '<div class="claim-status">✓ 已领取</div>' : '';
        
        element.innerHTML = `
            <div class="item-image">
                <div class="item-icon">${prize.icon}</div>
                <div class="item-glow"></div>
            </div>
            <div class="item-info">
                <div class="member-card-time${isClaimed ? ' claimed' : ''}">${timeDisplay}</div>
                <div class="item-name">${prize.name}</div>
                <div class="item-description">${prize.description}</div>
                ${statusDisplay}
            </div>
            <button class="item-select-btn">${buttonText}</button>
        `;
        
        return element;
    }

    // 金色奖品领取
    claimGoldPrize(prizeElement) {
        const prizeId = prizeElement.getAttribute('data-prize-id');
        let goldInventory = Storage.get('goldInventory', []);
        const prize = goldInventory.find(item => item.id === prizeId);
        
        if (!prize) {
            DOMUtils.showToast('奖品不存在', 'error');
            return;
        }
        
        // 如果未领取，先标记为已领取
        if (!prize.claimed) {
            const prizeIndex = goldInventory.findIndex(item => item.id === prizeId);
            if (prizeIndex !== -1) {
                goldInventory[prizeIndex].claimed = true;
                goldInventory[prizeIndex].claimedAt = TimeUtils.now();
                Storage.set('goldInventory', goldInventory);
                
                // 更新当前prize对象的状态
                prize.claimed = true;
                prize.claimedAt = goldInventory[prizeIndex].claimedAt;
                
                // 更新元素状态
                this.updatePrizeElementStatus(prizeId, prize);
                
                DOMUtils.showToast('恭喜！奖品领取成功', 'success');
            }
        }
        
        // 显示CDK弹窗
        this.showCdkModal(prize);
    }

    // 显示CDK弹窗
    showCdkModal(prize) {
        const modal = document.getElementById('cdkModal');
        const modalTitle = modal?.querySelector('.modal-header h3');
        const prizeIcon = document.getElementById('cdkPrizeIcon');
        const prizeName = document.getElementById('cdkPrizeName');
        const prizeDesc = modal?.querySelector('.cdk-prize-desc');
        const confirmBtn = document.getElementById('confirmCdkReceived');
        
        if (!modal) return;
        
        // 保存当前奖品信息
        this.currentClaimingPrize = prize;
        
        // 更新弹窗标题
        if (modalTitle) {
            modalTitle.textContent = '奖品CDK';
        }
        
        // 更新弹窗内容
        if (prizeIcon) prizeIcon.textContent = prize.icon;
        if (prizeName) prizeName.textContent = prize.name;
        
        // 更新描述和按钮（现在都是已领取状态）
        if (prizeDesc) {
            prizeDesc.textContent = '请保存以下CDK码，用于兑换奖品';
        }
        
        if (confirmBtn) {
            confirmBtn.textContent = '确定';
        }
        
        // 显示弹窗
        modal.classList.add('show');
    }

    // 绑定CDK弹窗
    bindCdkModal() {
        const modal = document.getElementById('cdkModal');
        const closeBtn = modal?.querySelector('.close-btn');
        const closeCdkBtn = document.getElementById('closeCdkModal');
        const confirmBtn = document.getElementById('confirmCdkReceived');
        const copyBtn = document.getElementById('copyCdkBtn');
        
        // 关闭按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeCdkModal();
            });
        }
        
        if (closeCdkBtn) {
            closeCdkBtn.addEventListener('click', () => {
                this.closeCdkModal();
            });
        }
        
        // 确认按钮
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmCdkReceived();
            });
        }
        
        // 复制按钮
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyCdkCode();
            });
        }
        
        // 点击背景关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCdkModal();
                }
            });
        }
    }

    // 复制CDK码
    async copyCdkCode() {
        const cdkInput = document.getElementById('cdkCode');
        if (!cdkInput) return;
        
        const success = await StringUtils.copyToClipboard(cdkInput.value);
        if (success) {
            DOMUtils.showToast('CDK码已复制到剪贴板', 'success');
        } else {
            DOMUtils.showToast('复制失败，请手动复制', 'error');
        }
    }

    // 确认CDK已收到
    confirmCdkReceived() {
        if (!this.currentClaimingPrize) return;
        
        // 显示CDK码已保存的提示
        DOMUtils.showToast('CDK码已保存', 'info');
        
        this.closeCdkModal();
    }

    // 更新奖品元素状态
    updatePrizeElementStatus(prizeId, updatedPrize) {
        const prizeElement = document.querySelector(`[data-prize-id="${prizeId}"]`);
        if (!prizeElement) return;
        
        // 添加已领取样式
        prizeElement.classList.add('claimed');
        
        // 更新时间显示
        const timeElement = prizeElement.querySelector('.member-card-time');
        if (timeElement) {
            const obtainTime = TimeUtils.formatTimestamp(updatedPrize.timestamp, 'MM-DD HH:mm');
            const claimTime = TimeUtils.formatTimestamp(updatedPrize.claimedAt, 'MM-DD HH:mm');
            timeElement.textContent = `获得时间：${obtainTime} | 领取时间：${claimTime}`;
            timeElement.classList.add('claimed');
        }
        
        // 更新按钮文字
        const button = prizeElement.querySelector('.item-select-btn');
        if (button) {
            button.textContent = '已领取';
        }
        
        // 添加已领取状态提示
        const itemInfo = prizeElement.querySelector('.item-info');
        if (itemInfo && !itemInfo.querySelector('.claim-status')) {
            const statusDiv = document.createElement('div');
            statusDiv.className = 'claim-status';
            statusDiv.textContent = '✓ 已领取';
            itemInfo.appendChild(statusDiv);
        }
    }

    // 关闭CDK弹窗
    closeCdkModal() {
        const modal = document.getElementById('cdkModal');
        if (modal) {
            modal.classList.remove('show');
        }
        this.currentClaimingPrize = null;
    }

    // 绑定结果模态框
    bindResultModal() {
        const modal = document.getElementById('resultModal');
        const closeBtn = modal?.querySelector('.close-btn');

        // 关闭按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeResultModal();
            });
        }

        // 点击背景关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeResultModal();
                }
            });
        }
    }

    // 关闭结果模态框
    closeResultModal() {
        const modal = document.getElementById('resultModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // 绑定分享功能
    bindShareFunction() {
        const shareLinkBtn = document.getElementById('shareLink');
        const shareQRBtn = document.getElementById('shareQR');
        const clearDataBtn = document.getElementById('clearDataBtn');

        if (shareLinkBtn) {
            shareLinkBtn.addEventListener('click', () => {
                this.shareLink();
            });
        }

        if (shareQRBtn) {
            shareQRBtn.addEventListener('click', () => {
                this.generateQRCodeWithDevBonus();
            });
        }

        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    // 分享链接
    async shareLink() {
        const shareText = 'VPS回馈用户抽奖活动正在进行中！快来参与吧！';
        const shareUrl = window.location.href;
        const fullText = `${shareText} ${shareUrl}`;

        const success = await StringUtils.copyToClipboard(fullText);
        if (success) {
            DOMUtils.showToast('分享链接已复制到剪贴板', 'success');
        } else {
            DOMUtils.showToast('复制失败，请手动复制', 'error');
        }
    }

    // 生成二维码（包含开发者奖励）
    generateQRCodeWithDevBonus() {
        const qrContainer = document.getElementById('qrcode');
        if (!qrContainer) return;

        const shareUrl = window.location.href;
        
        // 简单的二维码文本显示（实际应用中可以使用QR码库）
        qrContainer.innerHTML = `
            <div style="padding: 20px; background: white; color: black; border-radius: 8px;">
                <div style="text-align: center; margin-bottom: 10px; font-weight: bold;">活动链接</div>
                <div style="word-break: break-all; font-size: 12px;">${shareUrl}</div>
                <div style="text-align: center; margin-top: 10px; font-size: 10px; color: #666;">
                    请扫描二维码或复制链接参与活动
                </div>
            </div>
        `;
        qrContainer.style.display = 'block';

        // 开发者奖励：增加10000V豆
        this.lotterySystem.userResources.vBeans += 10000;
        this.lotterySystem.saveUserResources();
        this.lotterySystem.updateResourceDisplay();

        DOMUtils.showToast('二维码已生成，获得10000V豆开发者奖励！', 'success');
    }

    // 清除所有数据
    clearAllData() {
        if (confirm('确定要清除所有数据吗？这将删除所有抽奖记录、V豆和抽奖次数！')) {
            // 清除抽奖系统数据
            this.lotterySystem.prizeManager.resetStatistics();
            
            // 重置用户资源
            this.lotterySystem.userResources = {
                drawTickets: 10,
                vBeans: 100
            };
            this.lotterySystem.saveUserResources();
            
            // 清除历史记录
            this.lotterySystem.drawHistory = [];
            Storage.set('drawHistory', []);
            
            // 清除金色奖品背包
            Storage.remove('goldInventory');
            
            // 清除首充状态
            Storage.remove('firstChargeStatus');
            
            // 重置其他状态
            this.lotterySystem.firstTenDrawUsed = false;
            Storage.remove('firstTenDrawUsed');
            
            // 重置分页
            this.currentHistoryPage = 1;
            
            // 更新所有显示
            this.lotterySystem.updateResourceDisplay();
            if (this.currentTab === 'history') {
                this.loadHistoryContent();
            }
            
            DOMUtils.showToast('所有数据已清除！', 'success');
        }
    }

    // 绑定键盘快捷键
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 按1键单抽
            if (e.key === '1' && !e.ctrlKey && !e.altKey) {
                if (!this.lotterySystem.isDrawing) {
                    this.lotterySystem.drawSingle();
                }
            }
            
            // 按0键十连抽
            if (e.key === '0' && !e.ctrlKey && !e.altKey) {
                if (!this.lotterySystem.isDrawing) {
                    this.lotterySystem.drawTen();
                }
            }
            
            // ESC键关闭模态框
            if (e.key === 'Escape') {
                this.closeResultModal();
                this.closeExchangeModal();
                this.closeCdkModal();
                this.closeRechargeModal();
            }
        });
    }

    // 初始化界面
    initializeUI() {
        // 更新资源显示
        this.lotterySystem.updateResourceDisplay();
        
        // 加载当前标签页内容
        this.loadTabContent(this.currentTab);
        
        // 添加CSS动画样式
        this.addDynamicStyles();
    }

    // 添加动态样式
    addDynamicStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            .empty-history {
                text-align: center;
                padding: 40px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 1.1em;
            }
            
            .history-time {
                font-size: 0.9em;
                opacity: 0.8;
                margin-bottom: 5px;
            }
            
            .history-type {
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    // 检查活动状态
    checkActivityStatus() {
        if (!TimeUtils.isInActivityTime()) {
            DOMUtils.showToast('活动已结束，但您仍可以查看历史记录', 'warning', 5000);
            
            // 禁用抽奖按钮
            const singleBtn = document.getElementById('singleDraw');
            const tenBtn = document.getElementById('tenDraw');
            
            if (singleBtn) {
                singleBtn.disabled = true;
                singleBtn.style.opacity = '0.5';
            }
            if (tenBtn) {
                tenBtn.disabled = true;
                tenBtn.style.opacity = '0.5';
            }
        }
    }

    // 开发者工具已整合到界面中
    enableDevTools() {
        // 开发者工具现在通过界面操作：
        // 1. 点击"生成二维码"按钮获得10000V豆
        // 2. 点击"清除数据(测试)"按钮清除所有数据
        console.log('开发者工具已整合到分享页面中');
    }

    // 绑定资源加号按钮
    bindResourceAddButtons() {
        const addTicketsBtn = document.getElementById('addTicketsBtn');
        const addVBeansBtn = document.getElementById('addVBeansBtn');
        
        // 抽奖次数加号按钮 - 跳转到V豆兑换页面并定位
        if (addTicketsBtn) {
            addTicketsBtn.addEventListener('click', () => {
                this.switchTab('exchange');
                // 延迟执行滚动和高亮，确保标签页切换完成
                setTimeout(() => {
                    this.scrollToExchangeSection();
                    this.highlightExchangeSection();
                }, 100);
                DOMUtils.showToast('已跳转到抽奖券兑换', 'info');
            });
        }
        
        // V豆加号按钮 - 显示充值弹窗
        if (addVBeansBtn) {
            addVBeansBtn.addEventListener('click', () => {
                this.showVBeanRechargeModal();
            });
        }
    }

    // 滚动到兑换区域
    scrollToExchangeSection() {
        const exchangeCategory = document.querySelector('.exchange-category');
        if (exchangeCategory) {
            // 计算元素到页面顶部的距离
            const elementTop = exchangeCategory.offsetTop;
            const elementHeight = exchangeCategory.offsetHeight;
            const windowHeight = window.innerHeight;
            
            // 计算让元素在屏幕中间的滚动位置
            const targetScrollTop = elementTop - (windowHeight - elementHeight) / 2;
            
            // 平滑滚动到目标位置
            window.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
            });
        }
    }

    // 高亮兑换区域
    highlightExchangeSection() {
        const exchangeSection = document.querySelector('.exchange-category');
        if (exchangeSection) {
            exchangeSection.style.animation = 'highlightPulse 2s ease-in-out';
            setTimeout(() => {
                exchangeSection.style.animation = '';
            }, 2000);
        }
    }

    // 显示V豆充值弹窗
    showVBeanRechargeModal() {
        const modal = document.getElementById('rechargeModal');
        const currentBalance = document.getElementById('currentBalance');
        
        if (!modal) return;
        
        // 更新当前余额显示
        if (currentBalance) {
            currentBalance.textContent = this.lotterySystem.userResources.vBeans;
        }
        
        // 重置选择状态
        this.selectedRechargeAmount = null;
        this.selectedRechargeTier = null;
        this.selectedRechargePrice = null;
        this.updateRechargeConfirmButton();
        
        // 更新首充状态显示
        this.updateFirstChargeStatus();
        
        // 显示弹窗
        modal.classList.add('show');
    }

    // 获取首充状态
    getFirstChargeStatus() {
        const firstChargeData = Storage.get('firstChargeStatus') || {};
        return firstChargeData;
    }

    // 设置首充状态
    setFirstChargeStatus(tier, status = true) {
        const firstChargeData = this.getFirstChargeStatus();
        firstChargeData[tier] = status;
        Storage.set('firstChargeStatus', firstChargeData);
    }

    // 检查指定档位是否已首充
    isFirstCharged(tier) {
        const firstChargeData = this.getFirstChargeStatus();
        return firstChargeData[tier] || false;
    }

    // 更新首充状态显示
    updateFirstChargeStatus() {
        const rechargeOptions = document.querySelectorAll('.recharge-option');
        rechargeOptions.forEach(option => {
            const tier = option.getAttribute('data-tier');
            const isCharged = this.isFirstCharged(tier);
            
            if (isCharged) {
                option.classList.add('first-charged');
            } else {
                option.classList.remove('first-charged');
            }
        });
    }

    // 绑定充值弹窗
    bindRechargeModal() {
        const modal = document.getElementById('rechargeModal');
        const closeBtn = modal?.querySelector('.close-btn');
        const cancelBtn = document.getElementById('cancelRecharge');
        const confirmBtn = document.getElementById('confirmRecharge');
        
        // 绑定充值选项点击事件
        const rechargeOptions = document.querySelectorAll('.recharge-option');
        rechargeOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectRechargeOption(option);
            });
        });
        
        // 关闭按钮
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeRechargeModal();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeRechargeModal();
            });
        }
        
        // 确认按钮
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.confirmRecharge();
            });
        }
        
        // 点击背景关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeRechargeModal();
                }
            });
        }
    }

    // 选择充值选项
    selectRechargeOption(optionElement) {
        // 清除之前的选择
        document.querySelectorAll('.recharge-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // 选择当前选项
        optionElement.classList.add('selected');
        this.selectedRechargeAmount = parseInt(optionElement.getAttribute('data-amount'));
        this.selectedRechargeTier = optionElement.getAttribute('data-tier');
        this.selectedRechargePrice = parseInt(optionElement.getAttribute('data-price'));
        
        // 更新确认按钮状态
        this.updateRechargeConfirmButton();
    }

    // 更新确认按钮状态
    updateRechargeConfirmButton() {
        const confirmBtn = document.getElementById('confirmRecharge');
        if (confirmBtn) {
            if (this.selectedRechargeAmount && this.selectedRechargeTier) {
                confirmBtn.disabled = false;
                
                // 检查是否首充
                const isFirstCharge = !this.isFirstCharged(this.selectedRechargeTier);
                if (isFirstCharge) {
                    const totalAmount = this.selectedRechargeAmount * 2;
                    confirmBtn.textContent = `首充双倍！获得 ${totalAmount} V豆 (¥${this.selectedRechargePrice})`;
                } else {
                    confirmBtn.textContent = `确认充值 ${this.selectedRechargeAmount} V豆 (¥${this.selectedRechargePrice})`;
                }
            } else {
                confirmBtn.disabled = true;
                confirmBtn.textContent = '请选择充值金额';
            }
        }
    }

    // 确认充值
    confirmRecharge() {
        if (!this.selectedRechargeAmount || !this.selectedRechargeTier) return;
        
        // 检查是否首充
        const isFirstCharge = !this.isFirstCharged(this.selectedRechargeTier);
        let actualAmount = this.selectedRechargeAmount;
        
        if (isFirstCharge) {
            // 首充双倍
            actualAmount = this.selectedRechargeAmount * 2;
            // 记录首充状态
            this.setFirstChargeStatus(this.selectedRechargeTier, true);
        }
        
        // 执行充值
        this.lotterySystem.userResources.vBeans += actualAmount;
        this.lotterySystem.saveUserResources();
        this.lotterySystem.updateResourceDisplay();
        
        // 显示成功提示
        if (isFirstCharge) {
            DOMUtils.showToast(`首充成功！获得${actualAmount}V豆（双倍奖励）`, 'success');
        } else {
            DOMUtils.showToast(`充值成功！获得${actualAmount}V豆`, 'success');
        }
        
        // 关闭弹窗
        this.closeRechargeModal();
    }

    // 关闭充值弹窗
    closeRechargeModal() {
        const modal = document.getElementById('rechargeModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        // 清除选择状态
        document.querySelectorAll('.recharge-option').forEach(option => {
            option.classList.remove('selected');
        });
        this.selectedRechargeAmount = null;
        this.selectedRechargeTier = null;
        this.selectedRechargePrice = null;
    }


}

// 创建全局应用实例
let app;

// 自动启动应用
window.addEventListener('load', () => {
    app = new App();
    app.enableDevTools();
});

// 导出到全局
window.App = App; 