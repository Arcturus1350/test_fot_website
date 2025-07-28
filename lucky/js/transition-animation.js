// 过渡动画系统
class TransitionAnimation {
    constructor() {
        this.scene = null;
        this.isPlaying = false;
        this.onComplete = null;
        
        this.init();
    }

    init() {
        this.createScene();
        this.bindEvents();
    }

    // 绑定事件
    bindEvents() {
        // 跳过按钮点击
        document.addEventListener('click', (e) => {
            if (e.target.id === 'skipTransitionBtn') {
                this.skipAnimation();
            }
        });

        // ESC键跳过
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPlaying) {
                this.skipAnimation();
            }
        });
    }

    // 创建动画场景
    createScene() {
        if (document.getElementById('transitionAnimation')) {
            return;
        }

        const scene = document.createElement('div');
        scene.id = 'transitionAnimation';
        scene.className = 'transition-animation';
        
        scene.innerHTML = `
            <div class="scene-container" id="sceneContainer">
                <!-- 场景一：初始状态 -->
                <div class="scene-1" id="scene1">
                    <!-- 鼠标指针 -->
                    <div class="mouse-cursor"></div>
                    <!-- 滑轨箭头 -->
                    <div class="arrow-blink"></div>
                </div>
                
                <!-- 场景二：图标容器 -->
                <div class="icons-container" id="iconsContainer">
                    <div class="icon icon-red diamond-pos">🔴</div>
                    <div class="icon icon-blue diamond-pos">W</div>
                    <div class="icon icon-orange diamond-pos">P</div>
                    <div class="icon icon-green diamond-pos">S</div>
                </div>
                
                <!-- 场景四：板块容器 -->
                <div class="blocks-container" id="blocksContainer">
                    <div class="rising-block block-1">
                        <div class="block-icon">💬</div>
                    </div>
                    <div class="rising-block block-2">
                        <div class="block-icon">➡️</div>
                    </div>
                    <div class="rising-block block-3">
                        <div class="block-icon">⭕</div>
                    </div>
                    <div class="rising-block block-4">
                        <div class="block-icon">⬟</div>
                    </div>
                </div>
                
                <!-- 场景五：最终展示 -->
                <div class="final-scene" id="finalScene"></div>
            </div>
            
            <!-- 跳过按钮 -->
            <button class="skip-transition-btn" id="skipTransitionBtn">跳过动画 (ESC)</button>
        `;
        
        document.body.appendChild(scene);
        this.scene = scene;
    }

    // 播放过渡动画
    async playTransition(onCompleteCallback = null, hasGoldPrize = false) {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        this.onComplete = onCompleteCallback;
        this.hasGoldPrize = hasGoldPrize;
        
        // 显示动画场景
        this.scene.classList.add('active');
        
        // 如果有金色奖品，添加鼠标残影效果
        if (hasGoldPrize) {
            this.addMouseTrails();
        }
        
        // 执行动画序列
        await this.executeAnimationSequence();
        
        // 动画完成
        this.completeAnimation();
    }

    // 执行动画序列
    async executeAnimationSequence() {
        const sceneContainer = document.getElementById('sceneContainer');
        const iconsContainer = document.getElementById('iconsContainer');
        
        // 场景一：图标上升 (0-0.5s)；同时 鼠标滑动 (0~3s)
        await this.sleep(500);
        
        // 场景二：图标精准移动到板块位置 (0.5-3s)
        sceneContainer.classList.add('phase-3');
        iconsContainer.classList.add('diamond-layout');
        
        // 为每个图标分配移动路径到板块位置
        this.assignRandomPaths();
        
        await this.sleep(2500); // 2.5秒的移动时间
        
        // 场景四：板块从图标位置出现 (3-4s)，同时图标渐渐消失
        await this.sleep(1000);
        
        // 场景五：星空展现 (4-5.5s)
        await this.sleep(1500);
        
        // 开始淡出
        this.scene.classList.add('fade-out');
        await this.sleep(500);
    }

    // 完成动画
    completeAnimation() {
        this.scene.classList.remove('active', 'fade-out');
        
        // 重置所有动画状态
        this.resetAnimationState();
        
        this.isPlaying = false;
        
        // 执行回调
        if (this.onComplete) {
            this.onComplete();
            this.onComplete = null;
        }
    }

    // 为图标分配移动路径到板块位置
    assignRandomPaths() {
        const icons = document.querySelectorAll('.icon.diamond-pos');
        const animations = ['moveRandomA', 'moveRandomB', 'moveRandomC', 'moveRandomD'];
        
        icons.forEach((icon, index) => {
            // 按顺序分配动画，确保每个图标都有对应的板块位置
            const assignedAnimation = animations[index % animations.length];
            
            // 移除原有的动画类
            icon.style.animation = 'none';
            
            // 强制重绘
            icon.offsetHeight;
            
            // 设置对应的动画 (0.5s开始，持续2.5s)
            icon.style.animation = `${assignedAnimation} 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.5s forwards, iconFadeOut 1s ease-out 3s forwards`;
        });
    }

    // 添加鼠标残影效果（金色奖品专用）
    addMouseTrails() {
        const scene1 = document.getElementById('scene1');
        if (!scene1) return;
        
        // 创建3个残影鼠标
        for (let i = 1; i <= 3; i++) {
            const trailMouse = document.createElement('div');
            trailMouse.className = `mouse-trail mouse-trail-${i}`;
            trailMouse.style.cssText = `
                position: absolute;
                left: 10%;
                top: 60%;
                width: 20px;
                height: 20px;
                background: rgba(255, 215, 0, ${0.8 - i * 0.2});
                clip-path: polygon(0 0, 0 20px, 7px 15px, 12px 25px, 17px 21px, 10px 10px, 20px 8px);
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
                animation: mouseSlideTrail${i} 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${i * 0.1}s forwards;
                z-index: ${100 - i};
            `;
            scene1.appendChild(trailMouse);
        }
    }

    // 重置动画状态
    resetAnimationState() {
        const sceneContainer = document.getElementById('sceneContainer');
        const iconsContainer = document.getElementById('iconsContainer');
        
        if (sceneContainer) {
            sceneContainer.classList.remove('phase-3');
        }
        
        if (iconsContainer) {
            iconsContainer.classList.remove('diamond-layout');
        }
        
        // 重置所有图标位置
        const icons = this.scene.querySelectorAll('.icon');
        icons.forEach(icon => {
            icon.style.transform = '';
            icon.style.animation = '';
        });
        
        // 移除鼠标残影
        const trails = this.scene.querySelectorAll('.mouse-trail');
        trails.forEach(trail => trail.remove());
    }

    // 跳过动画
    skipAnimation() {
        if (!this.isPlaying) return;
        
        // 立即完成动画
        this.scene.classList.add('fade-out');
        
        setTimeout(() => {
            this.completeAnimation();
        }, 100);
    }

    // 工具函数：延迟
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 检查是否正在播放
    isAnimationPlaying() {
        return this.isPlaying;
    }
}

// 全局过渡动画实例
window.transitionAnimation = new TransitionAnimation();

// 导出函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TransitionAnimation };
} 