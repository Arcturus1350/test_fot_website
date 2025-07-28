// 抽卡动画系统
class CardDrawAnimation {
    constructor() {
        this.scene = null;
        this.isAnimating = false;
        this.cardElements = [];
        this.prizes = [];
        this.currentDrawType = 'single'; // 'single' 或 'multi'
        
        this.init();
    }

    init() {
        this.createScene();
        this.bindEvents();
    }

    // 创建抽卡场景
    createScene() {
        if (document.getElementById('cardDrawScene')) {
            return;
        }

        const scene = document.createElement('div');
        scene.id = 'cardDrawScene';
        scene.className = 'card-draw-scene';
        
        scene.innerHTML = `
            <!-- 关闭按钮 -->
            <div class="card-scene-close" id="cardSceneClose">✕</div>
            
            <!-- 卡片容器 -->
            <div class="card-display-area" id="cardDisplayArea">
                <!-- 动态生成卡片 -->
            </div>
            
            <!-- 控制按钮 -->
            <div class="card-draw-controls" id="cardDrawControls">
                <button class="card-draw-btn" id="flipAllCards">翻开所有卡片</button>
                <button class="card-draw-btn" id="skipAnimation">跳过动画</button>
            </div>
            
            <!-- 粒子效果容器 -->
            <div class="particles" id="particlesContainer"></div>
        `;
        
        document.body.appendChild(scene);
        this.scene = scene;
    }

    // 绑定事件
    bindEvents() {
        // 关闭场景
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cardSceneClose') {
                this.closeScene();
            }
        });

        // 翻开所有卡片
        document.addEventListener('click', (e) => {
            if (e.target.id === 'flipAllCards') {
                this.flipAllCards();
            }
        });

        // 跳过动画
        document.addEventListener('click', (e) => {
            if (e.target.id === 'skipAnimation') {
                this.skipAnimation();
            }
        });

        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.scene.classList.contains('active')) {
                this.closeScene();
            }
        });

        // 点击卡片翻转
        document.addEventListener('click', (e) => {
            if (e.target.closest('.card') && !this.isAnimating) {
                const card = e.target.closest('.card');
                this.flipCard(card);
            }
        });
    }

    // 开始抽卡动画
    async startCardDraw(prizes, drawType = 'single', hasGoldPrize = false) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.prizes = prizes;
        this.currentDrawType = drawType;
        this.cardElements = [];

        // 先播放过渡动画（5秒），传递金色奖品信息
        if (window.transitionAnimation && !window.transitionAnimation.isAnimationPlaying()) {
            await new Promise((resolve) => {
                window.transitionAnimation.playTransition(() => {
                    resolve();
                }, hasGoldPrize);
            });
        }

        // 显示抽卡场景
        this.scene.classList.add('active');
        
        // 创建卡片
        this.createCards();
        
        // 播放入场动画
        await this.playEntranceAnimation();
        
        // 生成粒子效果
        this.generateParticles();
        
        this.isAnimating = false;
    }

    // 创建卡片元素
    createCards() {
        const displayArea = document.getElementById('cardDisplayArea');
        displayArea.innerHTML = '';
        
        // 设置容器类型
        const containerClass = this.currentDrawType === 'single' ? 'single-card-container' : 'multi-card-container';
        displayArea.className = `card-display-area ${containerClass}`;
        
        // 创建卡片
        this.prizes.forEach((prize, index) => {
            const cardContainer = this.createCardElement(prize, index);
            displayArea.appendChild(cardContainer);
            this.cardElements.push(cardContainer);
        });
    }

    // 创建单个卡片元素
    createCardElement(prize, index) {
        const container = document.createElement('div');
        container.className = 'card-container';
        
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.index = index;
        
        // 卡片背面
        const cardBack = document.createElement('div');
        cardBack.className = 'card-face card-back';
        
        // 卡片正面
        const cardFront = document.createElement('div');
        cardFront.className = `card-face card-front quality-${prize.quality}`;
        
        cardFront.innerHTML = `
            <div class="card-icon">${prize.icon}</div>
            <div class="card-name">${prize.name}</div>
            ${prize.amount ? `<div class="card-amount">${prize.amount}</div>` : ''}
        `;
        
        card.appendChild(cardBack);
        card.appendChild(cardFront);
        container.appendChild(card);
        
        return container;
    }

    // 播放入场动画
    async playEntranceAnimation() {
        const delay = this.currentDrawType === 'single' ? 0 : 100;
        
        for (let i = 0; i < this.cardElements.length; i++) {
            const card = this.cardElements[i].querySelector('.card');
            const cardBack = card.querySelector('.card-back');
            
            setTimeout(() => {
                card.classList.add('card-appear');
                
                // 播放背景切换动画
                if (cardBack) {
                    cardBack.classList.add('reveal-animation');
                }
                
                // 金色卡片特殊效果
                const prize = this.prizes[i];
                if (prize.quality === 'gold') {
                    this.createExplosionEffect(this.cardElements[i]);
                }
            }, i * delay);
        }
        
        // 等待所有动画完成（包括2秒的背景切换动画）
        const totalTime = (this.cardElements.length - 1) * delay + 2500;
        await this.sleep(totalTime);
    }

    // 翻转单张卡片
    flipCard(cardElement) {
        if (cardElement.classList.contains('flipped')) return;
        
        cardElement.classList.add('flipped');
        
        // 获取奖品信息
        const index = parseInt(cardElement.dataset.index);
        const prize = this.prizes[index];
        
        // 特殊效果
        if (prize.quality === 'gold') {
            this.createExplosionEffect(cardElement.parentElement);
            this.generateSpecialParticles(cardElement.parentElement);
        }
    }

    // 翻开所有卡片
    async flipAllCards() {
        const cards = this.scene.querySelectorAll('.card:not(.flipped)');
        
        for (let i = 0; i < cards.length; i++) {
            setTimeout(() => {
                this.flipCard(cards[i]);
            }, i * 200);
        }
        
        // 等待一段时间后显示结果总结
        setTimeout(() => {
            this.showResultSummary();
        }, cards.length * 200 + 2000);
    }

    // 跳过动画
    skipAnimation() {
        // 立即翻开所有卡片
        const cards = this.scene.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.add('flipped');
            card.classList.remove('card-appear');
        });
        
        // 立即显示结果
        this.showResultSummary();
    }

    // 显示结果总结
    showResultSummary() {
        // 这里可以添加结果统计显示
        console.log('抽卡结果:', this.prizes);
        
        // 隐藏控制按钮
        const controls = document.getElementById('cardDrawControls');
        if (controls) {
            controls.style.display = 'none';
        }
        
        // 3秒后自动关闭
        setTimeout(() => {
            this.closeScene();
        }, 3000);
    }

    // 创建爆炸效果
    createExplosionEffect(container) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion-effect';
        
        // 创建爆炸粒子
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            
            const angle = (i * 30) * Math.PI / 180;
            const distance = 80 + Math.random() * 40;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            particle.style.setProperty('--x', `${x}px`);
            particle.style.setProperty('--y', `${y}px`);
            particle.style.transform = `translate(${x}px, ${y}px)`;
            
            explosion.appendChild(particle);
        }
        
        container.appendChild(explosion);
        
        // 移除爆炸效果
        setTimeout(() => {
            if (explosion.parentElement) {
                explosion.parentElement.removeChild(explosion);
            }
        }, 1000);
    }

    // 生成特殊粒子效果
    generateSpecialParticles(container) {
        const rect = container.getBoundingClientRect();
        const particlesContainer = document.getElementById('particlesContainer');
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const x = rect.left + rect.width / 2 - 2;
            const y = rect.top + rect.height / 2 - 2;
            
            particle.style.left = `${x}px`;
            particle.style.top = `${y}px`;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            
            particlesContainer.appendChild(particle);
            
            // 移除粒子
            setTimeout(() => {
                if (particle.parentElement) {
                    particle.parentElement.removeChild(particle);
                }
            }, 3000);
        }
    }

    // 生成背景粒子
    generateParticles() {
        const particlesContainer = document.getElementById('particlesContainer');
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                particle.style.left = `${Math.random() * window.innerWidth}px`;
                particle.style.top = `${window.innerHeight}px`;
                particle.style.animationDelay = `${Math.random() * 2}s`;
                
                particlesContainer.appendChild(particle);
                
                // 移除粒子
                setTimeout(() => {
                    if (particle.parentElement) {
                        particle.parentElement.removeChild(particle);
                    }
                }, 3000);
            }, i * 100);
        }
    }

    // 关闭场景
    closeScene() {
        this.scene.classList.remove('active');
        this.isAnimating = false;
        this.cardElements = [];
        this.prizes = [];
        
        // 清理粒子
        const particlesContainer = document.getElementById('particlesContainer');
        if (particlesContainer) {
            particlesContainer.innerHTML = '';
        }
        
        // 重置控制按钮
        const controls = document.getElementById('cardDrawControls');
        if (controls) {
            controls.style.display = 'flex';
        }
    }

    // 工具函数：延迟
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 全局抽卡动画实例
window.cardDrawAnimation = new CardDrawAnimation();

// 与现有抽奖系统集成的函数
function showCardDrawAnimation(prizes, drawType) {
    // 转换奖品格式为卡片动画需要的格式
    const cardPrizes = prizes.map(prize => ({
        name: prize.name,
        icon: prize.icon,
        amount: prize.amount,
        quality: prize.quality
    }));
    
    // 检测是否包含金色奖品
    const hasGoldPrize = prizes.some(prize => prize.quality === 'gold');
    
    // 开始抽卡动画，传递金色奖品信息
    window.cardDrawAnimation.startCardDraw(cardPrizes, drawType, hasGoldPrize);
}

// 导出函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CardDrawAnimation, showCardDrawAnimation };
} 