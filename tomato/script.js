class PomodoroTimer {
    constructor() {
        // 设置
        this.settings = {
            workTime: 25,
            shortBreak: 5,
            longBreak: 15,
            autoStart: false,
            darkMode: false,
            volume: 50,
            leftOpacity: 0.9,
            rightOpacity: 0.9
        };
        
        // 计时器状态
        this.isRunning = false;
        this.currentPhase = 'work'; // work, shortBreak, longBreak
        this.timeLeft = this.settings.workTime * 60; // 秒
        this.originalTime = this.settings.workTime * 60;
        this.completedCycles = 0;
        this.cycleCount = 1;
        this.timer = null;
        this.currentTaskId = null;
        
        // 任务和统计数据
        this.tasks = [];
        
        // 高级任务相关
        this.currentTimeSequence = [];
        this.currentSequenceIndex = 0;
        this.isAdvancedTask = false;
        
        // 一言相关
        this.lastHitokotoTime = 0;
        
        // 确认对话框相关
        this.confirmResolve = null;
        
        // 删除对话框相关
        this.deleteResolve = null;
        this.taskToDelete = null;
        
        // 拖拽相关
        this.draggedElement = null;
        this.draggedIndex = -1;
        
        this.stats = {
            totalTomatoes: 0,
            totalTime: 0,
            dailyData: {},
            weeklyData: []
        };
        
        // 音频上下文
        this.audioContext = null;
        this.initAudio();
        
        // 初始化
        this.loadData();
        this.initUI();
        this.bindEvents();
        this.updateDisplay();
        this.updateStats();
        this.generateWeeklyChart();
    }
    
    // 初始化音频
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }
    
    // 播放提示音
    playSound(type = 'work') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const volume = this.settings.volume / 100;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 不同类型的音效
        const soundConfigs = {
            work: { frequencies: [523, 659, 784], duration: 0.5 },
            shortBreak: { frequencies: [440], duration: 0.3 },
            longBreak: { frequencies: [523, 659, 784, 1047], duration: 0.8 }
        };
        
        const config = soundConfigs[type];
        let delay = 0;
        
        config.frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.frequency.value = freq;
                osc.type = 'sine';
                
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                
                osc.start(this.audioContext.currentTime);
                osc.stop(this.audioContext.currentTime + 0.3);
            }, delay);
            delay += 200;
        });
    }
    
    // 初始化UI
    initUI() {
        // 标签切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(targetTab + 'Tab').classList.add('active');
            });
        });
    }
    
    // 绑定事件
    bindEvents() {
        // 主要控制按钮
        document.getElementById('startPauseBtn').addEventListener('click', () => this.toggleTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());
        document.getElementById('skipBtn').addEventListener('click', () => this.skipPhase());
        
        // 音量控制
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.settings.volume = parseInt(e.target.value);
            this.saveSettings();
        });
        
        document.getElementById('testSoundBtn').addEventListener('click', () => {
            this.playSound('work');
        });
        
        // 任务管理
        document.getElementById('addTaskBtn').addEventListener('click', () => this.addTask());
        document.getElementById('newTaskInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        
        // 高级任务功能
        document.getElementById('advancedTaskBtn').addEventListener('click', () => this.openAdvancedTaskModal());
        document.getElementById('modalClose').addEventListener('click', () => this.closeAdvancedTaskModal());
        document.getElementById('cancelModal').addEventListener('click', () => this.closeAdvancedTaskModal());
        document.getElementById('saveAdvancedTask').addEventListener('click', () => this.saveAdvancedTask());
        document.getElementById('addWorkTime').addEventListener('click', () => this.addTimeSegment('work'));
        document.getElementById('addBreakTime').addEventListener('click', () => this.addTimeSegment('break'));
        
        // 点击弹窗背景关闭弹窗
        document.getElementById('advancedTaskModal').addEventListener('click', (e) => {
            if (e.target.id === 'advancedTaskModal') {
                this.closeAdvancedTaskModal();
            }
        });
        
        // 确认对话框事件
        document.getElementById('confirmCancel').addEventListener('click', () => this.handleConfirmResult(false));
        document.getElementById('confirmOk').addEventListener('click', () => this.handleConfirmResult(true));
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') {
                this.handleConfirmResult(false);
            }
        });
        
        // 删除确认对话框事件
        document.getElementById('deleteCancel').addEventListener('click', () => this.handleDeleteResult(false));
        document.getElementById('deleteConfirm').addEventListener('click', () => this.handleDeleteResult(true));
        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.handleDeleteResult(false);
            }
        });
        
        // 一言点击刷新
        document.getElementById('currentTask').addEventListener('click', () => this.fetchHitokoto());
        
        // 设置滑块
        this.bindSettingSliders();
        
        // 初始化一言（延迟一下确保DOM完全加载）
        setTimeout(() => {
            this.lastHitokotoTime = 0; // 重置时间以确保初始化时能正常请求
            this.fetchHitokoto();
        }, 100);
        
        // 透明度控制
        document.getElementById('opacitySlider').addEventListener('input', (e) => {
            const opacity = parseFloat(e.target.value);
            this.settings.leftOpacity = opacity;
            this.settings.rightOpacity = opacity;
            this.updateOpacity();
            this.saveSettings();
            document.getElementById('opacityValue').textContent = Math.round(opacity * 100) + '%';
        });
        
        // 其他设置
        document.getElementById('autoStartCheckbox').addEventListener('change', (e) => {
            this.settings.autoStart = e.target.checked;
            this.saveSettings();
        });
        
        document.getElementById('darkModeCheckbox').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            this.toggleDarkMode();
            this.saveSettings();
        });
        
        document.getElementById('exportDataBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn').addEventListener('click', () => this.importData());
        document.getElementById('resetDataBtn').addEventListener('click', () => this.resetData());
        
        // 文件导入
        document.getElementById('importFileInput').addEventListener('change', (e) => this.handleFileImport(e));
    }
    
    // 绑定设置滑块
    bindSettingSliders() {
        const sliders = [
            { id: 'workTime', setting: 'workTime' },
            { id: 'shortBreak', setting: 'shortBreak' },
            { id: 'longBreak', setting: 'longBreak' }
        ];
        
        sliders.forEach(slider => {
            const sliderElement = document.getElementById(slider.id + 'Slider');
            const inputElement = document.getElementById(slider.id + 'Input');
            
            // 初始化值
            sliderElement.value = this.settings[slider.setting];
            inputElement.value = this.settings[slider.setting];
            
            // 滑块变化事件
            sliderElement.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                this.settings[slider.setting] = value;
                inputElement.value = value;
                this.saveSettings();
                this.checkTimeReset(slider.setting);
            });
            
            // 输入框变化事件
            inputElement.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                const min = parseInt(e.target.min);
                const max = parseInt(e.target.max);
                
                if (value >= min && value <= max) {
                    this.settings[slider.setting] = value;
                    sliderElement.value = value;
                    this.saveSettings();
                    this.checkTimeReset(slider.setting);
                }
            });
            
            // 输入框失去焦点时验证
            inputElement.addEventListener('blur', (e) => {
                const value = parseInt(e.target.value);
                const min = parseInt(e.target.min);
                const max = parseInt(e.target.max);
                
                if (isNaN(value) || value < min || value > max) {
                    e.target.value = this.settings[slider.setting];
                }
            });
        });
    }
    
    // 检查是否需要重置计时器
    checkTimeReset(setting) {
        if ((setting === 'workTime' && this.currentPhase === 'work') ||
            (setting === 'shortBreak' && this.currentPhase === 'shortBreak') ||
            (setting === 'longBreak' && this.currentPhase === 'longBreak')) {
            this.resetTimer();
        }
    }
    
    // 更新透明度
    updateOpacity() {
        document.documentElement.style.setProperty('--left-opacity', this.settings.leftOpacity);
        document.documentElement.style.setProperty('--right-opacity', this.settings.rightOpacity);
    }
    
    // 切换深色模式
    toggleDarkMode() {
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }
    
    // 开始/暂停计时器
    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    // 开始计时器
    startTimer() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        this.isRunning = true;
        document.getElementById('startPauseBtn').textContent = '暂停';
        document.getElementById('phaseDisplay').textContent = '专注中...';
        document.body.classList.add(this.currentPhase === 'work' ? 'working' : this.currentPhase);
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();
            
            if (this.timeLeft <= 0) {
                this.completePhase();
            }
        }, 1000);
    }
    
    // 暂停计时器
    pauseTimer() {
        this.isRunning = false;
        clearInterval(this.timer);
        document.getElementById('startPauseBtn').textContent = '开始';
        document.getElementById('phaseDisplay').textContent = '已暂停';
        document.body.classList.remove('working', 'shortBreak', 'longBreak');
    }
    
    // 重置计时器
    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.getPhaseTime(this.currentPhase) * 60;
        this.originalTime = this.timeLeft;
        document.getElementById('phaseDisplay').textContent = '准备开始';
        this.updateDisplay();
    }
    
    // 跳过当前阶段
    skipPhase() {
        if (this.isRunning) {
            this.completePhase();
        } else {
            this.nextPhase();
            this.resetTimer();
        }
    }
    
    // 完成当前阶段
    completePhase() {
        this.pauseTimer();
        this.playSound(this.currentPhase);
        this.showNotification(this.getPhaseCompleteMessage());
        
        if (this.currentPhase === 'work') {
            this.completedCycles++;
            this.updateTaskProgress();
            this.updateTodayStats();
        }
        
        // 如果是高级任务，使用高级任务的下一阶段逻辑
        if (this.isAdvancedTask) {
            this.nextAdvancedPhase();
        } else {
            this.nextPhase();
            
            if (this.settings.autoStart) {
                setTimeout(() => {
                    this.resetTimer();
                    this.startTimer();
                }, 3000);
            } else {
                this.resetTimer();
            }
        }
    }
    
    // 下一阶段
    nextPhase() {
        if (this.currentPhase === 'work') {
            if (this.completedCycles % 4 === 0) {
                this.currentPhase = 'longBreak';
            } else {
                this.currentPhase = 'shortBreak';
            }
        } else {
            this.currentPhase = 'work';
            if (this.currentPhase === 'work') {
                this.cycleCount++;
            }
        }
        
        this.updatePhaseDisplay();
    }
    
    // 获取阶段时间
    getPhaseTime(phase) {
        const times = {
            work: this.settings.workTime,
            shortBreak: this.settings.shortBreak,
            longBreak: this.settings.longBreak
        };
        return times[phase];
    }
    
    // 获取阶段完成消息
    getPhaseCompleteMessage() {
        const messages = {
            work: '🍅 工作时间结束！休息一下吧～',
            shortBreak: '⏰ 短休息结束！继续专注工作！',
            longBreak: '🎉 长休息结束！准备开始新的工作循环！'
        };
        return messages[this.currentPhase];
    }
    
    // 更新阶段显示
    updatePhaseDisplay() {
        const phaseNames = {
            work: '工作时间',
            shortBreak: '短休息',
            longBreak: '长休息'
        };
        
        document.getElementById('currentStatus').textContent = phaseNames[this.currentPhase];
        document.getElementById('currentCycle').textContent = this.cycleCount;
    }
    
    // 更新显示
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timeDisplay').textContent = timeString;
        
        // 更新进度环
        const progress = 1 - (this.timeLeft / this.originalTime);
        const circumference = 2 * Math.PI * 120;
        const offset = circumference * (1 - progress);
        
        const progressCircle = document.getElementById('progressCircle');
        progressCircle.style.strokeDashoffset = offset;
        
        // 更新今日完成数
        document.getElementById('todayCount').textContent = this.getTodayTomatoes();
    }
    
    // 任务管理
    addTask() {
        const input = document.getElementById('newTaskInput');
        const taskText = input.value.trim();
        
        if (taskText) {
            // 为普通任务创建标准的时间序列：工作->短休息->工作->长休息
            const standardTimeSequence = [
                { id: Date.now() + 1, type: 'work', duration: this.settings.workTime },
                { id: Date.now() + 2, type: 'break', duration: this.settings.shortBreak },
                { id: Date.now() + 3, type: 'work', duration: this.settings.workTime },
                { id: Date.now() + 4, type: 'break', duration: this.settings.longBreak }
            ];
            
            const task = {
                id: Date.now(),
                text: taskText,
                completed: false,
                tomatoes: 0,
                createdAt: new Date().toISOString(),
                isStandard: true, // 标记为标准任务
                timeSequence: standardTimeSequence,
                totalDuration: standardTimeSequence.reduce((sum, segment) => sum + segment.duration, 0)
            };
            
            this.tasks.push(task);
            this.renderTasks();
            this.saveData();
            input.value = '';
            
            this.showNotification(`📝 任务"${taskText}"创建成功！`);
        }
    }
    
    // 渲染任务列表
    renderTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }
    
    // 创建任务元素
    createTaskElement(task) {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''} ${task.isAdvanced ? 'advanced-task' : ''} ${task.isStandard ? 'standard-task' : ''}`;
        div.setAttribute('data-task-id', task.id);
        
        // 生成时间序列显示文本
        const getTimeSequenceText = (timeSequence) => {
            if (!timeSequence || timeSequence.length === 0) return '';
            return timeSequence.map(segment => {
                const type = segment.type === 'work' ? '工作' : '休息';
                return `${type}${segment.duration}分`;
            }).join(' → ');
        };
        
        let taskInfo;
        
        if (task.isAdvanced) {
            // 高级任务：显示⚡图标和总时长
            taskInfo = `<div class="task-info">
                <span class="task-text">⚡ ${task.text}</span>
                <span class="task-duration">⏱️ ${task.totalDuration}分钟</span>
                <span class="task-tomatoes">🍅 ${task.tomatoes}</span>
            </div>`;
        } else if (task.isStandard && task.timeSequence) {
            // 标准任务：显示⚡图标和总时长
            taskInfo = `<div class="task-info">
                <span class="task-text">⚡ ${task.text}</span>
                <span class="task-duration">⏱️ ${task.totalDuration}分钟</span>
                <span class="task-tomatoes">🍅 ${task.tomatoes}</span>
            </div>`;
        } else {
            // 旧版普通任务：只显示任务名和番茄数
            taskInfo = `<div class="task-info">
                <span class="task-text">${task.text}</span>
                <span class="task-tomatoes">🍅 ${task.tomatoes}</span>
            </div>`;
        }
        
        const isCurrentTask = this.currentTaskId === task.id;
        const buttonText = '开始'; // 统一所有任务都显示"开始"
        const buttonClass = 'btn-secondary';
        
        const startButton = isCurrentTask ? 
            `<button class="btn btn-small btn-current" disabled>当前</button>` :
            ((task.isAdvanced || task.isStandard) ? 
                `<button class="btn btn-small ${buttonClass}" onclick="timer.startAdvancedTaskSync(timer.tasks.find(t => t.id === ${task.id}))">
                    ${buttonText}
                </button>` :
                `<button class="btn btn-small ${buttonClass}" onclick="timer.setCurrentTaskSync(${task.id})">
                    ${buttonText}
                </button>`);
        
        div.innerHTML = `
            ${taskInfo}
            <div class="task-actions">
                ${startButton}
                <button class="btn btn-small btn-secondary" onclick="timer.toggleTaskComplete(${task.id})">
                    ${task.completed ? '恢复' : '完成'}
                </button>
                <button class="btn btn-small btn-secondary" onclick="timer.deleteTaskSync(${task.id})">删除</button>
            </div>
        `;
        
        return div;
    }
    
    // 设置当前任务
    async setCurrentTask(taskId) {
        // 如果当前有任务在运行，且要切换到不同的任务，需要确认
        if (this.isRunning && this.currentTaskId && this.currentTaskId !== taskId) {
            const currentTask = this.tasks.find(t => t.id === this.currentTaskId);
            const newTask = this.tasks.find(t => t.id === taskId);
            
            const confirmMessage = `
                <div>计时器正在运行中！</div>
                <div class="task-name">当前任务：${currentTask ? currentTask.text : '未知任务'}</div>
                <div class="task-name">要切换到：${newTask ? newTask.text : '未知任务'}</div>
                <div class="warning-text">确定要切换吗？（当前计时进度会保留并关联到新任务）</div>
            `;
            
            const confirmed = await this.showConfirmDialog(confirmMessage);
            if (!confirmed) {
                return; // 用户取消，不执行切换
            }
            
            // 切换成功后显示提示
            if (newTask) {
                this.showNotification(`✅ 已切换到任务：${newTask.text}`);
            }
        }
        
        this.currentTaskId = taskId;
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            // 现在currentTask用于显示一言，不再显示任务名称
            // 可以在这里添加其他UI更新逻辑，比如在状态栏显示任务名称
        }
        this.renderTasks();
        this.saveData();
    }
    
    // 同步包装方法（用于onclick调用）
    setCurrentTaskSync(taskId) {
        this.setCurrentTask(taskId).catch(error => {
            console.error('设置当前任务失败:', error);
        });
    }
    
    startAdvancedTaskSync(task) {
        this.startAdvancedTask(task).catch(error => {
            console.error('启动高级任务失败:', error);
        });
    }
    
    deleteTaskSync(taskId) {
        this.deleteTask(taskId).catch(error => {
            console.error('删除任务失败:', error);
        });
    }
    
    // 切换任务完成状态
    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.renderTasks();
            this.saveData();
        }
    }
    
    // 删除任务
    async deleteTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        const confirmed = await this.showDeleteDialog(task.text);
        if (confirmed) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            if (this.currentTaskId === taskId) {
                this.currentTaskId = null;
                // 删除任务后不需要重置一言显示
            }
            this.renderTasks();
            this.saveData();
            
            this.showNotification(`🗑️ 任务"${task.text}"已删除`);
        }
    }
    
    // 获取一言
    async fetchHitokoto() {
        // 防止频繁请求（1秒内只能请求一次）
        const now = Date.now();
        if (now - this.lastHitokotoTime < 1000) {
            return;
        }
        this.lastHitokotoTime = now;
        
        const textElement = document.getElementById('currentTask');
        
        // 添加加载状态
        textElement.classList.add('hitokoto-loading');
        
        try {
            // 设置10秒超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('https://v1.hitokoto.cn', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error('网络请求失败');
            }
            
            const data = await response.json();
            
            // 更新显示内容
            textElement.textContent = data.hitokoto;
            
        } catch (error) {
            console.error('获取一言失败:', error);
            
            if (error.name === 'AbortError') {
                textElement.textContent = '请求超时，点击重试';
                this.showNotification('⏱️ 请求超时，请重试');
            } else {
                textElement.textContent = '获取一言失败，点击重试';
                this.showNotification('❌ 获取一言失败，请检查网络连接');
            }
        } finally {
            // 移除加载状态
            textElement.classList.remove('hitokoto-loading');
        }
    }
    
    // 显示任务选择器
    showTaskSelector() {
        // 切换到任务标签
        document.querySelector('[data-tab="tasks"]').click();
    }
    
    // 更新任务进度
    updateTaskProgress() {
        if (this.currentTaskId) {
            const task = this.tasks.find(t => t.id === this.currentTaskId);
            if (task) {
                task.tomatoes++;
                this.renderTasks();
                this.saveData();
            }
        }
    }
    
    // 统计功能
    updateTodayStats() {
        const today = new Date().toDateString();
        if (!this.stats.dailyData[today]) {
            this.stats.dailyData[today] = { tomatoes: 0, time: 0 };
        }
        
        this.stats.dailyData[today].tomatoes++;
        this.stats.dailyData[today].time += this.settings.workTime;
        this.stats.totalTomatoes++;
        this.stats.totalTime += this.settings.workTime;
        
        this.updateStats();
        this.generateWeeklyChart();
        this.saveData();
    }
    
    // 获取今日番茄数
    getTodayTomatoes() {
        const today = new Date().toDateString();
        return this.stats.dailyData[today]?.tomatoes || 0;
    }
    
    // 更新统计显示
    updateStats() {
        document.getElementById('totalTomatoes').textContent = this.stats.totalTomatoes;
        document.getElementById('totalTime').textContent = Math.round(this.stats.totalTime / 60 * 10) / 10 + 'h';
        
        const days = Object.keys(this.stats.dailyData).length;
        const avgDaily = days > 0 ? Math.round(this.stats.totalTomatoes / days * 10) / 10 : 0;
        document.getElementById('avgDaily').textContent = avgDaily;
    }
    
    // 生成周图表
    generateWeeklyChart() {
        const chartContainer = document.getElementById('weeklyChart');
        chartContainer.innerHTML = '';
        
        const weekDays = this.getLastWeekDays();
        const maxTomatoes = Math.max(...weekDays.map(day => day.tomatoes), 1);
        
        weekDays.forEach((day, index) => {
            const barContainer = document.createElement('div');
            barContainer.className = 'chart-bar-container';
            
            const bar = document.createElement('div');
            bar.className = `chart-bar ${day.isToday ? 'today' : ''}`;
            bar.style.height = `${(day.tomatoes / maxTomatoes) * 100}%`;
            bar.title = `${day.label}: ${day.tomatoes} 个番茄`;
            
            const numberLabel = document.createElement('div');
            numberLabel.className = `chart-number ${day.tomatoes === 0 ? 'zero' : ''}`;
            numberLabel.textContent = day.tomatoes;
            
            barContainer.appendChild(numberLabel);
            barContainer.appendChild(bar);
            chartContainer.appendChild(barContainer);
        });
    }
    
    // 获取最近7天数据
    getLastWeekDays() {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toDateString();
            
            days.push({
                label: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
                tomatoes: this.stats.dailyData[dateString]?.tomatoes || 0,
                isToday: i === 0
            });
        }
        
        return days;
    }
    
    // 显示通知
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // 数据导出
    exportData() {
        const data = {
            settings: this.settings,
            tasks: this.tasks,
            stats: this.stats,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('📤 数据导出成功！');
    }
    
    // 数据导入
    importData() {
        document.getElementById('importFileInput').click();
    }
    
    // 处理文件导入
    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
            this.showNotification('❌ 请选择JSON格式的文件！');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!data.settings || !data.tasks || !data.stats) {
                    throw new Error('数据格式不正确');
                }
                
                // 确认导入
                if (confirm('导入数据会覆盖当前所有数据，确定要继续吗？')) {
                    this.settings = { ...this.settings, ...data.settings };
                    this.tasks = data.tasks || [];
                    this.stats = data.stats || this.stats;
                    this.currentTaskId = data.currentTaskId || null;
                    
                    // 更新UI
                    this.updateOpacity();
                    this.toggleDarkMode();
                    this.renderTasks();
                    this.updateStats();
                    this.generateWeeklyChart();
                    this.loadData(); // 重新应用所有设置
                    
                    this.showNotification('📥 数据导入成功！');
                }
            } catch (error) {
                console.error('导入失败:', error);
                this.showNotification('❌ 数据导入失败：文件格式不正确！');
            }
        };
        
        reader.readAsText(file);
        
        // 清空文件输入
        event.target.value = '';
    }
    
    // 重置数据
    resetData() {
        if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
            this.tasks = [];
            this.stats = {
                totalTomatoes: 0,
                totalTime: 0,
                dailyData: {},
                weeklyData: []
            };
            this.currentTaskId = null;
            
            this.renderTasks();
            this.updateStats();
            this.generateWeeklyChart();
            this.saveData();
            
            // 重置后获取新的一言
            this.fetchHitokoto();
            this.showNotification('🔄 数据重置成功！');
        }
    }
    
    // 保存设置
    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }
    
    // 保存数据
    saveData() {
        const data = {
            tasks: this.tasks,
            stats: this.stats,
            currentTaskId: this.currentTaskId
        };
        localStorage.setItem('pomodoroData', JSON.stringify(data));
    }
    
    // 加载数据
    loadData() {
        // 加载设置
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // 加载数据
        const savedData = localStorage.getItem('pomodoroData');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.tasks = data.tasks || [];
            this.stats = data.stats || this.stats;
            this.currentTaskId = data.currentTaskId;
        }
        
        // 应用设置
        this.updateOpacity();
        this.toggleDarkMode();
        
        // 更新UI
        document.getElementById('volumeSlider').value = this.settings.volume;
        document.getElementById('autoStartCheckbox').checked = this.settings.autoStart;
        document.getElementById('darkModeCheckbox').checked = this.settings.darkMode;
        document.getElementById('opacitySlider').value = this.settings.leftOpacity;
        document.getElementById('opacityValue').textContent = Math.round(this.settings.leftOpacity * 100) + '%';
        
        // 更新时间设置UI
        document.getElementById('workTimeSlider').value = this.settings.workTime;
        document.getElementById('workTimeInput').value = this.settings.workTime;
        document.getElementById('shortBreakSlider').value = this.settings.shortBreak;
        document.getElementById('shortBreakInput').value = this.settings.shortBreak;
        document.getElementById('longBreakSlider').value = this.settings.longBreak;
        document.getElementById('longBreakInput').value = this.settings.longBreak;
        
        // 更新当前任务显示
        if (this.currentTaskId) {
            const task = this.tasks.find(t => t.id === this.currentTaskId);
            if (task) {
                // 现在currentTask用于显示一言，不再显示任务名称
                // 任务信息可以在其他地方显示
            }
        }
        
        // 如果不在高级任务模式且当前是工作阶段，更新时间显示
        if (!this.isAdvancedTask && this.currentPhase === 'work' && !this.isRunning) {
            this.timeLeft = this.settings.workTime * 60;
            this.originalTime = this.settings.workTime * 60;
            this.updateDisplay();
        }
        
        // 渲染任务列表
        this.renderTasks();
    }
    
    // 自定义确认对话框
    showConfirmDialog(message) {
        return new Promise((resolve) => {
            this.confirmResolve = resolve;
            
            // 设置消息内容
            document.getElementById('confirmMessage').innerHTML = message;
            
            // 显示对话框
            document.getElementById('confirmModal').classList.add('show');
            
            // 添加键盘事件监听
            this.addConfirmKeyListener();
        });
    }
    
    handleConfirmResult(result) {
        // 隐藏对话框
        document.getElementById('confirmModal').classList.remove('show');
        
        // 移除键盘事件监听
        this.removeConfirmKeyListener();
        
        // 调用回调
        if (this.confirmResolve) {
            this.confirmResolve(result);
            this.confirmResolve = null;
        }
    }
    
    addConfirmKeyListener() {
        this.confirmKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.handleConfirmResult(false);
            } else if (e.key === 'Enter') {
                this.handleConfirmResult(true);
            }
        };
        document.addEventListener('keydown', this.confirmKeyHandler);
    }
    
    removeConfirmKeyListener() {
        if (this.confirmKeyHandler) {
            document.removeEventListener('keydown', this.confirmKeyHandler);
            this.confirmKeyHandler = null;
        }
    }
    
    // 自定义删除确认对话框
    showDeleteDialog(taskName) {
        return new Promise((resolve) => {
            this.deleteResolve = resolve;
            
            // 设置消息内容
            const message = `
                <div>确定要删除这个任务吗？</div>
                <div class="task-name" style="margin: 10px 0; font-weight: 600; color: var(--danger-color);">"${taskName}"</div>
                <div class="warning-text" style="color: var(--text-secondary); font-size: 0.9em;">删除后无法恢复</div>
            `;
            document.getElementById('deleteMessage').innerHTML = message;
            
            // 显示对话框
            document.getElementById('deleteModal').classList.add('show');
            
            // 添加键盘事件监听
            this.addDeleteKeyListener();
        });
    }
    
    handleDeleteResult(result) {
        // 隐藏对话框
        document.getElementById('deleteModal').classList.remove('show');
        
        // 移除键盘事件监听
        this.removeDeleteKeyListener();
        
        // 调用回调
        if (this.deleteResolve) {
            this.deleteResolve(result);
            this.deleteResolve = null;
        }
    }
    
    addDeleteKeyListener() {
        this.deleteKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.handleDeleteResult(false);
            } else if (e.key === 'Enter') {
                this.handleDeleteResult(true);
            }
        };
        document.addEventListener('keydown', this.deleteKeyHandler);
    }
    
    removeDeleteKeyListener() {
        if (this.deleteKeyHandler) {
            document.removeEventListener('keydown', this.deleteKeyHandler);
            this.deleteKeyHandler = null;
        }
    }
    
    // 高级任务弹窗管理
    openAdvancedTaskModal() {
        this.currentTimeSequence = [];
        document.getElementById('advancedTaskName').value = '';
        document.getElementById('timeSequence').innerHTML = '';
        this.updateTotalDuration();
        document.getElementById('advancedTaskModal').classList.add('show');
    }
    
    closeAdvancedTaskModal() {
        document.getElementById('advancedTaskModal').classList.remove('show');
    }
    
    // 添加时间段
    addTimeSegment(type) {
        const segment = {
            id: Date.now(),
            type: type, // 'work' or 'break'
            duration: type === 'work' ? this.settings.workTime : this.settings.shortBreak
        };
        
        this.currentTimeSequence.push(segment);
        this.renderTimeSequence();
        this.updateTotalDuration();
    }
    
    // 渲染时间序列
    renderTimeSequence() {
        const container = document.getElementById('timeSequence');
        container.innerHTML = '';
        
        if (this.currentTimeSequence.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); margin: 20px 0;">点击下方按钮添加时间段</p>';
            return;
        }
        
        this.currentTimeSequence.forEach((segment, index) => {
            const segmentElement = document.createElement('div');
            segmentElement.className = 'time-item';
            segmentElement.draggable = true;
            segmentElement.dataset.segmentId = segment.id;
            segmentElement.dataset.index = index;
            segmentElement.innerHTML = `
                <div class="drag-handle" title="拖动排序">⋮⋮</div>
                <span class="time-type ${segment.type}">${segment.type === 'work' ? '工作' : '休息'}</span>
                <div class="time-duration">
                    <input type="number" value="${segment.duration}" min="1" max="${segment.type === 'work' ? '60' : '30'}" 
                           onchange="timer.updateSegmentDuration(${segment.id}, this.value)">
                    <span>分钟</span>
                </div>
                <button class="time-remove" onclick="timer.removeTimeSegment(${segment.id})">删除</button>
            `;
            
            // 添加拖拽事件监听
            this.addDragListeners(segmentElement);
            container.appendChild(segmentElement);
        });
    }
    
    // 更新时间段时长
    updateSegmentDuration(segmentId, duration) {
        const segment = this.currentTimeSequence.find(s => s.id === segmentId);
        if (segment) {
            segment.duration = parseInt(duration);
            this.updateTotalDuration();
        }
    }
    
    // 添加拖拽事件监听
    addDragListeners(element) {
        element.addEventListener('dragstart', (e) => this.handleDragStart(e));
        element.addEventListener('dragover', (e) => this.handleDragOver(e));
        element.addEventListener('drop', (e) => this.handleDrop(e));
        element.addEventListener('dragend', (e) => this.handleDragEnd(e));
        element.addEventListener('dragenter', (e) => this.handleDragEnter(e));
        element.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }
    
    // 拖拽开始
    handleDragStart(e) {
        this.draggedElement = e.target;
        this.draggedIndex = parseInt(e.target.dataset.index);
        e.target.classList.add('dragging');
        
        // 设置拖拽数据
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }
    
    // 拖拽经过
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }
    
    // 拖拽进入
    handleDragEnter(e) {
        e.preventDefault();
        if (e.target.classList.contains('time-item') && e.target !== this.draggedElement) {
            e.target.classList.add('drag-over');
        }
    }
    
    // 拖拽离开
    handleDragLeave(e) {
        if (e.target.classList.contains('time-item')) {
            e.target.classList.remove('drag-over');
        }
    }
    
    // 放置
    handleDrop(e) {
        e.preventDefault();
        e.target.classList.remove('drag-over');
        
        if (e.target.classList.contains('time-item') && e.target !== this.draggedElement) {
            const targetIndex = parseInt(e.target.dataset.index);
            this.reorderTimeSequence(this.draggedIndex, targetIndex);
        }
    }
    
    // 拖拽结束
    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        // 清理所有拖拽相关的样式
        document.querySelectorAll('.time-item').forEach(item => {
            item.classList.remove('drag-over');
        });
        this.draggedElement = null;
        this.draggedIndex = -1;
    }
    
    // 重新排序时间序列
    reorderTimeSequence(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        // 移动数组元素
        const movedItem = this.currentTimeSequence.splice(fromIndex, 1)[0];
        this.currentTimeSequence.splice(toIndex, 0, movedItem);
        
        // 重新渲染
        this.renderTimeSequence();
        this.updateTotalDuration();
        
        // 显示提示
        this.showNotification('✅ 时间段顺序已调整');
    }
    
    // 删除时间段
    removeTimeSegment(segmentId) {
        this.currentTimeSequence = this.currentTimeSequence.filter(s => s.id !== segmentId);
        this.renderTimeSequence();
        this.updateTotalDuration();
    }
    
    // 更新总时长显示
    updateTotalDuration() {
        const total = this.currentTimeSequence.reduce((sum, segment) => sum + segment.duration, 0);
        document.getElementById('totalDuration').textContent = `${total}分钟`;
    }
    
    // 保存高级任务
    saveAdvancedTask() {
        const taskName = document.getElementById('advancedTaskName').value.trim();
        
        if (!taskName) {
            alert('请输入任务名称！');
            return;
        }
        
        if (this.currentTimeSequence.length === 0) {
            alert('请至少添加一个时间段！');
            return;
        }
        
        const task = {
            id: Date.now(),
            text: taskName,
            completed: false,
            tomatoes: 0,
            createdAt: new Date().toISOString(),
            isAdvanced: true,
            timeSequence: [...this.currentTimeSequence],
            totalDuration: this.currentTimeSequence.reduce((sum, segment) => sum + segment.duration, 0)
        };
        
        this.tasks.push(task);
        this.renderTasks();
        this.saveData();
        this.closeAdvancedTaskModal();
        
        this.showNotification(`✨ 高级任务"${taskName}"创建成功！`);
    }
    
    // 启动高级任务
    async startAdvancedTask(task) {
        // 如果当前有任务在运行，且要切换到不同的任务，需要确认
        if (this.isRunning && this.currentTaskId && this.currentTaskId !== task.id) {
            const currentTask = this.tasks.find(t => t.id === this.currentTaskId);
            
            const confirmMessage = `
                <div>计时器正在运行中！</div>
                <div class="task-name">当前任务：${currentTask ? currentTask.text : '未知任务'}</div>
                <div class="task-name">要切换到高级任务：⚡ ${task.text}</div>
                <div class="warning-text">确定要切换吗？（当前计时会停止，开始执行新的高级任务时间序列）</div>
            `;
            
            const confirmed = await this.showConfirmDialog(confirmMessage);
            if (!confirmed) {
                return; // 用户取消，不执行切换
            }
            
            // 如果确认切换，先暂停当前计时器
            if (this.isRunning) {
                this.pauseTimer();
            }
        }
        
        this.isAdvancedTask = true;
        this.currentTimeSequence = [...task.timeSequence];
        this.currentSequenceIndex = 0;
        this.currentTaskId = task.id;
        
        const firstSegment = this.currentTimeSequence[0];
        this.currentPhase = firstSegment.type === 'work' ? 'work' : (firstSegment.type === 'break' ? 'shortBreak' : 'longBreak');
        this.timeLeft = firstSegment.duration * 60;
        this.originalTime = firstSegment.duration * 60;
        
        // 高级任务开始时不修改一言显示
        this.updateDisplay();
        this.renderTasks();
        
        this.showNotification(`🚀 开始执行高级任务：${task.text}`);
    }
    
    // 高级任务的下一个阶段
    nextAdvancedPhase() {
        this.currentSequenceIndex++;
        
        if (this.currentSequenceIndex >= this.currentTimeSequence.length) {
            // 高级任务完成
            this.completeAdvancedTask();
            return;
        }
        
        const nextSegment = this.currentTimeSequence[this.currentSequenceIndex];
        this.currentPhase = nextSegment.type === 'work' ? 'work' : (nextSegment.type === 'break' ? 'shortBreak' : 'longBreak');
        this.timeLeft = nextSegment.duration * 60;
        this.originalTime = nextSegment.duration * 60;
        
        this.updateDisplay();
        
        // 如果开启了自动开始，继续计时
        if (this.settings.autoStart) {
            this.startTimer();
        }
    }
    
    // 完成高级任务
    completeAdvancedTask() {
        this.isAdvancedTask = false;
        this.currentTimeSequence = [];
        this.currentSequenceIndex = 0;
        
        // 增加番茄数
        if (this.currentTaskId) {
            const task = this.tasks.find(t => t.id === this.currentTaskId);
            if (task) {
                task.tomatoes++;
                this.renderTasks();
            }
        }
        
        // 重置为普通工作时间
        this.currentPhase = 'work';
        this.timeLeft = this.settings.workTime * 60;
        this.originalTime = this.settings.workTime * 60;
        this.updateDisplay();
        
        this.showNotification('🎉 高级任务完成！');
    }
}

// 初始化番茄时钟
let timer;
document.addEventListener('DOMContentLoaded', () => {
    timer = new PomodoroTimer();
}); 