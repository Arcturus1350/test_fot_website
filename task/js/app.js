/**
 * 任务管理系统 - 主应用逻辑
 */
class TaskManager {
    constructor() {
        this.storage = new StorageManager();
        this.tasks = [];
        this.filteredTasks = [];
        this.currentFilter = {
            search: '',
            status: 'all',
            priority: 'all',
            category: 'all'
        };
        this.sortMode = 'time_priority'; // 默认排序方式：剩余时间 + 优先级
        this.currentTask = null; // 当前正在编辑的任务
        this.settings = this.storage.loadSettings();
        
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.loadTasks();
        this.setupEventListeners();
        this.attachTaskEventListeners(); // 只绑定一次任务事件监听器
        this.applyTheme();
        this.applyFilters(); // 应用筛选和排序，而不是直接渲染
        this.updateStats();
        
        // 显示欢迎消息
        if (this.tasks.length === 0) {
            setTimeout(() => {
                NotificationUtils.info('欢迎使用任务管理系统！点击"添加任务"开始管理你的任务。');
            }, 1000);
        }
    }

    /**
     * 加载任务数据
     */
    loadTasks() {
        try {
            this.tasks = this.storage.loadTasks();
            this.filteredTasks = [...this.tasks];
            console.log(`加载了 ${this.tasks.length} 个任务`);
        } catch (error) {
            console.error('加载任务失败:', error);
            NotificationUtils.error('加载任务数据失败，请刷新页面重试');
            this.tasks = [];
            this.filteredTasks = [];
        }
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 初始化自定义下拉组件
        this.initCustomSelects();

        // 添加任务按钮
        DOM.on(DOM.get('#addTaskBtn'), 'click', () => {
            this.showTaskModal();
        });

        // 搜索输入框
        const searchInput = DOM.get('#searchInput');
        DOM.on(searchInput, 'input', debounce((e) => {
            this.currentFilter.search = e.target.value;
            this.applyFilters();
        }, 300));

        // 筛选控件
        DOM.on(DOM.get('#statusFilter'), 'change', (e) => {
            this.currentFilter.status = e.target.value;
            this.applyFilters();
        });

        DOM.on(DOM.get('#priorityFilter'), 'change', (e) => {
            this.currentFilter.priority = e.target.value;
            this.applyFilters();
        });

        DOM.on(DOM.get('#categoryFilter'), 'change', (e) => {
            this.currentFilter.category = e.target.value;
            this.applyFilters();
        });

        // 排序方式选择器
        DOM.on(DOM.get('#sortMode'), 'change', (e) => {
            this.sortMode = e.target.value;
            this.applySort();
        });

        // 设置按钮
        DOM.on(DOM.get('#settingsBtn'), 'click', () => {
            this.showSettingsModal();
        });

        // 模态框事件
        this.setupModalEvents();

        // 键盘快捷键
        DOM.on(document, 'keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // 防止意外关闭页面（如果有未保存的更改）
        window.addEventListener('beforeunload', (e) => {
            // 这里可以添加检查是否有未保存的更改的逻辑
            // 暂时不实现，因为我们使用的是实时保存
        });
    }

    /**
     * 初始化自定义下拉组件
     */
    initCustomSelects() {
        // 为所有筛选器创建自定义下拉组件
        const selectors = ['#statusFilter', '#priorityFilter', '#categoryFilter', '#sortMode'];
        this.customSelects = {};

        selectors.forEach(selector => {
            const element = DOM.get(selector);
            if (element) {
                this.customSelects[selector] = new CustomSelect(element);
            }
        });
    }

    /**
     * 设置模态框事件
     */
    setupModalEvents() {
        // 任务表单模态框
        const taskModal = DOM.get('#taskModal');
        const taskForm = DOM.get('#taskForm');
        const closeModal = DOM.get('#closeModal');
        const cancelBtn = DOM.get('#cancelBtn');

        DOM.on(closeModal, 'click', () => {
            this.hideTaskModal();
        });

        DOM.on(cancelBtn, 'click', () => {
            this.hideTaskModal();
        });

        DOM.on(taskModal, 'click', (e) => {
            if (e.target === taskModal) {
                this.hideTaskModal();
            }
        });

        DOM.on(taskForm, 'submit', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // 删除确认模态框
        const deleteModal = DOM.get('#deleteModal');
        const cancelDelete = DOM.get('#cancelDelete');
        const confirmDelete = DOM.get('#confirmDelete');

        DOM.on(cancelDelete, 'click', () => {
            this.hideDeleteModal();
        });

        DOM.on(confirmDelete, 'click', () => {
            this.confirmDeleteTask();
        });

        DOM.on(deleteModal, 'click', (e) => {
            if (e.target === deleteModal) {
                this.hideDeleteModal();
            }
        });

        // ESC键关闭模态框
        DOM.on(document, 'keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideTaskModal();
                this.hideDeleteModal();
            }
        });
    }

    /**
     * 键盘快捷键处理
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + N: 新建任务
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.showTaskModal();
        }

        // Ctrl/Cmd + F: 聚焦搜索框
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            DOM.get('#searchInput').focus();
        }

        // Ctrl/Cmd + E: 导出数据
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.exportData();
        }

        // Ctrl/Cmd + D: 切换深色模式
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.toggleTheme();
        }
    }

    /**
     * 显示任务表单模态框
     */
    showTaskModal(task = null) {
        this.currentTask = task;
        const modal = DOM.get('#taskModal');
        const modalTitle = DOM.get('#modalTitle');
        const form = DOM.get('#taskForm');

        if (task) {
            modalTitle.textContent = '编辑任务';
            this.fillTaskForm(task);
        } else {
            modalTitle.textContent = '添加任务';
            this.resetTaskForm();
        }

        // 初始化表单中的自定义下拉组件
        this.initFormCustomSelects();

        DOM.show(modal);
        
        // 聚焦第一个输入框
        setTimeout(() => {
            DOM.get('#taskTitle').focus();
        }, 100);
    }

    /**
     * 初始化表单中的自定义下拉组件
     */
    initFormCustomSelects() {
        // 销毁之前的自定义下拉组件
        if (this.formCustomSelects) {
            Object.values(this.formCustomSelects).forEach(select => {
                if (select && select.destroy) {
                    select.destroy();
                }
            });
        }

        // 为表单中的下拉创建自定义组件
        const formSelectors = ['#taskPriority', '#taskCategory'];
        this.formCustomSelects = {};

        formSelectors.forEach(selector => {
            const element = DOM.get(selector);
            if (element) {
                this.formCustomSelects[selector] = new CustomSelect(element);
            }
        });
    }

    /**
     * 隐藏任务表单模态框
     */
    hideTaskModal() {
        const modal = DOM.get('#taskModal');
        DOM.hide(modal);
        this.currentTask = null;
        
        // 销毁表单中的自定义下拉组件
        if (this.formCustomSelects) {
            Object.values(this.formCustomSelects).forEach(select => {
                if (select && select.destroy) {
                    select.destroy();
                }
            });
            this.formCustomSelects = null;
        }
        
        this.resetTaskForm();
    }

    /**
     * 填充任务表单
     */
    fillTaskForm(task) {
        DOM.get('#taskTitle').value = task.title;
        DOM.get('#taskDescription').value = task.description;
        DOM.get('#taskPriority').value = task.priority;
        DOM.get('#taskCategory').value = task.category;
        DOM.get('#taskDueDate').value = task.dueDate ? DateUtils.toInputValue(task.dueDate) : '';

        // 更新自定义下拉组件的值
        setTimeout(() => {
            if (this.formCustomSelects) {
                if (this.formCustomSelects['#taskPriority']) {
                    this.formCustomSelects['#taskPriority'].setValue(task.priority);
                }
                if (this.formCustomSelects['#taskCategory']) {
                    this.formCustomSelects['#taskCategory'].setValue(task.category);
                }
            }
        }, 50);
    }

    /**
     * 重置任务表单
     */
    resetTaskForm() {
        const form = DOM.get('#taskForm');
        form.reset();
        
        // 设置默认值
        DOM.get('#taskPriority').value = this.settings.defaultPriority;
        DOM.get('#taskCategory').value = this.settings.defaultCategory;

        // 更新自定义下拉组件的默认值
        setTimeout(() => {
            if (this.formCustomSelects) {
                if (this.formCustomSelects['#taskPriority']) {
                    this.formCustomSelects['#taskPriority'].setValue(this.settings.defaultPriority);
                }
                if (this.formCustomSelects['#taskCategory']) {
                    this.formCustomSelects['#taskCategory'].setValue(this.settings.defaultCategory);
                }
            }
        }, 50);
    }

    /**
     * 保存任务
     */
    saveTask() {
        const formData = this.getTaskFormData();
        
        // 验证数据
        const validation = Task.validate(formData);
        if (!validation.isValid) {
            NotificationUtils.error(validation.errors[0]);
            return;
        }

        try {
            let task;
            let isNewTask = false;

            if (this.currentTask) {
                // 更新现有任务
                task = this.currentTask.update(formData);
            } else {
                // 创建新任务
                task = new Task(formData);
                isNewTask = true;
            }

            // 保存到存储
            const success = this.storage.saveTask(task);
            
            if (success) {
                if (isNewTask) {
                    this.tasks.push(task);
                    NotificationUtils.success('任务创建成功');
                } else {
                    // 更新任务列表中的任务
                    const index = this.tasks.findIndex(t => t.id === task.id);
                    if (index >= 0) {
                        this.tasks[index] = task;
                    }
                    NotificationUtils.success('任务更新成功');
                }

                this.applyFilters();
                this.updateStats();
                this.hideTaskModal();
            } else {
                NotificationUtils.error('保存任务失败，请重试');
            }
        } catch (error) {
            console.error('保存任务时出错:', error);
            NotificationUtils.error('保存任务时出现错误');
        }
    }

    /**
     * 获取表单数据
     */
    getTaskFormData() {
        const title = DOM.get('#taskTitle').value.trim();
        const description = DOM.get('#taskDescription').value.trim();
        const priority = DOM.get('#taskPriority').value;
        const category = DOM.get('#taskCategory').value;
        const dueDateValue = DOM.get('#taskDueDate').value;
        const dueDate = dueDateValue ? new Date(dueDateValue) : null;

        return {
            title,
            description,
            priority,
            category,
            dueDate
        };
    }

    /**
     * 删除任务
     */
    deleteTask(taskId) {
        this.taskToDelete = taskId;
        const deleteModal = DOM.get('#deleteModal');
        DOM.show(deleteModal);
    }

    /**
     * 确认删除任务
     */
    confirmDeleteTask() {
        if (!this.taskToDelete) return;

        try {
            const success = this.storage.deleteTask(this.taskToDelete);
            
            if (success) {
                this.tasks = this.tasks.filter(task => task.id !== this.taskToDelete);
                this.applyFilters();
                this.updateStats();
                NotificationUtils.success('任务删除成功');
            } else {
                NotificationUtils.error('删除任务失败，请重试');
            }
        } catch (error) {
            console.error('删除任务时出错:', error);
            NotificationUtils.error('删除任务时出现错误');
        }

        this.hideDeleteModal();
        this.taskToDelete = null;
    }

    /**
     * 隐藏删除确认模态框
     */
    hideDeleteModal() {
        const modal = DOM.get('#deleteModal');
        DOM.hide(modal);
        this.taskToDelete = null;
    }

    /**
     * 切换任务完成状态
     */
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        const wasCompleted = task.completed;

        try {
            task.toggleCompleted();
            const success = this.storage.saveTask(task);
            
            if (success) {
                // 如果任务从未完成变为完成，播放移动到底部的动画
                if (!wasCompleted && task.completed && taskElement) {
                    this.animateTaskToBottom(taskElement, () => {
                        // 动画完成后重新排序和渲染
                        this.applyFilters();
                        this.updateStats();
                    });
                } else {
                    // 直接重新排序和渲染
                    this.applyFilters();
                    this.updateStats();
                }
                
                // 只在出错时显示通知，正常切换状态时不显示通知
                // 用户可以通过视觉反馈（复选框状态、删除线等）看到状态变化
            } else {
                // 回滚状态
                task.toggleCompleted();
                NotificationUtils.error('更新任务状态失败，请重试');
            }
        } catch (error) {
            console.error('切换任务状态时出错:', error);
            NotificationUtils.error('更新任务状态时出现错误');
        }
    }

    /**
     * 播放任务移动到底部的动画
     */
    animateTaskToBottom(taskElement, callback) {
        // 检查用户是否偏好减少动画
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (prefersReducedMotion) {
            // 直接执行回调，跳过动画
            if (callback) callback();
            return;
        }
        
        // 添加动画类
        taskElement.style.animation = 'taskMoveToBottom 0.6s ease-in-out forwards';
        
        // 动画完成后的回调
        const handleAnimationEnd = () => {
            taskElement.removeEventListener('animationend', handleAnimationEnd);
            taskElement.style.animation = '';
            if (callback) callback();
        };
        
        taskElement.addEventListener('animationend', handleAnimationEnd);
        
        // 备用超时机制，防止动画事件不触发
        setTimeout(() => {
            if (taskElement.style.animation) {
                taskElement.removeEventListener('animationend', handleAnimationEnd);
                taskElement.style.animation = '';
                if (callback) callback();
            }
        }, 700);
    }

    /**
     * 应用筛选条件
     */
    applyFilters() {
        this.filteredTasks = this.tasks.filter(task => {
            // 搜索筛选
            if (this.currentFilter.search && !task.matchesSearch(this.currentFilter.search)) {
                return false;
            }

            // 状态筛选
            if (this.currentFilter.status !== 'all') {
                const isCompleted = this.currentFilter.status === 'completed';
                if (task.completed !== isCompleted) {
                    return false;
                }
            }

            // 优先级筛选
            if (this.currentFilter.priority !== 'all' && task.priority !== this.currentFilter.priority) {
                return false;
            }

            // 分类筛选
            if (this.currentFilter.category !== 'all' && task.category !== this.currentFilter.category) {
                return false;
            }

            return true;
        });

        this.applySort();
    }

    /**
     * 应用排序 - 按剩余时间和优先级排序
     */
    applySort() {
        this.filteredTasks.sort((a, b) => {
            // 第一优先级：已完成的任务排在最后
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // 如果都是已完成的任务，按完成时间排序（最近完成的在前）
            if (a.completed && b.completed) {
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            }

            // 对于未完成的任务，根据排序模式进行排序
            if (!a.completed && !b.completed) {
                if (this.sortMode === 'time_priority') {
                    // 模式1：剩余时间 + 优先级
                    // 第二优先级：按剩余天数排序（逾期任务在最前，剩余天数越少越前）
                    const aDays = a.getRemainingDays();
                    const bDays = b.getRemainingDays();
                    
                    if (aDays !== bDays) {
                        return aDays - bDays; // 负数(逾期) < 0(今天) < 正数(未来)
                    }

                    // 第三优先级：剩余天数相同时，按优先级排序（高优先级在前）
                    const aPriority = a.getPriorityValue();
                    const bPriority = b.getPriorityValue();
                    
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority;
                    }
                } else if (this.sortMode === 'priority_time') {
                    // 模式2：优先级 + 剩余时间
                    // 第二优先级：按优先级排序（高优先级在前）
                    const aPriority = a.getPriorityValue();
                    const bPriority = b.getPriorityValue();
                    
                    if (aPriority !== bPriority) {
                        return bPriority - aPriority;
                    }

                    // 第三优先级：优先级相同时，按剩余天数排序（剩余天数越少越前）
                    const aDays = a.getRemainingDays();
                    const bDays = b.getRemainingDays();
                    
                    if (aDays !== bDays) {
                        return aDays - bDays; // 负数(逾期) < 0(今天) < 正数(未来)
                    }
                }

                // 第四优先级：其他条件相同时，按创建时间排序（最新创建的在前）
                return new Date(b.createdAt) - new Date(a.createdAt);
            }

            return 0;
        });

        this.renderTasks();
    }

    /**
     * 渲染任务列表
     */
    renderTasks() {
        const taskList = DOM.get('#taskList');
        const emptyState = DOM.get('#emptyState');

        if (this.filteredTasks.length === 0) {
            DOM.hide(taskList);
            DOM.show(emptyState);
            
            // 根据是否有筛选条件显示不同的空状态消息
            const hasFilters = this.currentFilter.search || 
                             this.currentFilter.status !== 'all' || 
                             this.currentFilter.priority !== 'all' || 
                             this.currentFilter.category !== 'all';
            
            if (hasFilters) {
                emptyState.innerHTML = `
                    <span class="material-icons">search_off</span>
                    <h3>没有找到匹配的任务</h3>
                    <p>尝试调整筛选条件或搜索关键词</p>
                `;
            } else if (this.tasks.length === 0) {
                emptyState.innerHTML = `
                    <span class="material-icons">assignment</span>
                    <h3>还没有任务</h3>
                    <p>点击"添加任务"按钮创建你的第一个任务</p>
                `;
            }
            return;
        }

        DOM.show(taskList);
        DOM.hide(emptyState);

        taskList.innerHTML = this.filteredTasks.map(task => this.renderTaskItem(task)).join('');
    }

    /**
     * 渲染单个任务项
     */
    renderTaskItem(task) {
        const dueDateClass = task.isOverdue() ? 'overdue' : 
                           (task.dueDate && DateUtils.isToday(task.dueDate)) ? 'today' : '';

        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                <div class="task-header">
                    <div class="task-checkbox ${task.completed ? 'checked' : ''}" 
                         data-action="toggle" data-task-id="${task.id}">
                    </div>
                    <div class="task-content">
                        <h3 class="task-title">${StringUtils.escapeHtml(task.title)}</h3>
                        ${task.description ? `<p class="task-description">${StringUtils.escapeHtml(task.description)}</p>` : ''}
                        <div class="task-meta">
                            <span class="task-badge task-priority ${task.priority}">${task.getPriorityName()}</span>
                            <span class="task-badge task-category">${task.getCategoryName()}</span>
                            ${!task.completed && task.dueDate ? this.getRemainingDaysDisplay(task) : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" data-action="edit" data-task-id="${task.id}" title="编辑任务">
                            <span class="material-icons">edit</span>
                        </button>
                        <button class="task-action-btn delete" data-action="delete" data-task-id="${task.id}" title="删除任务">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 为任务项添加事件监听器（使用事件委托，只绑定一次）
     */
    attachTaskEventListeners() {
        const taskList = DOM.get('#taskList');

        DOM.on(taskList, 'click', (e) => {
            const action = e.target.dataset.action || e.target.parentElement?.dataset.action;
            const taskId = e.target.dataset.taskId || e.target.parentElement?.dataset.taskId;

            if (!action || !taskId) return;

            e.preventDefault();
            e.stopPropagation();

            switch (action) {
                case 'toggle':
                    this.toggleTaskCompletion(taskId);
                    break;
                case 'edit':
                    const task = this.tasks.find(t => t.id === taskId);
                    if (task) {
                        this.showTaskModal(task);
                    }
                    break;
                case 'delete':
                    this.deleteTask(taskId);
                    break;
            }
        });
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        const stats = this.storage.getTaskStats();
        
        DOM.get('#totalTasks').textContent = stats.total;
        DOM.get('#completedTasks').textContent = stats.completed;
        DOM.get('#pendingTasks').textContent = stats.pending;
        DOM.get('#completionRate').textContent = `${stats.completionRate}%`;
    }

    /**
     * 切换主题
     */
    toggleTheme() {
        const currentTheme = this.settings.theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        this.settings.theme = newTheme;
        this.storage.saveSettings(this.settings);
        this.applyTheme();
    }

    /**
     * 应用主题
     */
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.settings.theme);
        
        const themeToggle = DOM.get('#themeToggle');
        const icon = themeToggle.querySelector('.material-icons');
        icon.textContent = this.settings.theme === 'dark' ? 'light_mode' : 'dark_mode';
    }

    /**
     * 导出数据
     */
    exportData() {
        try {
            const exportData = this.storage.exportData();
            if (!exportData) {
                NotificationUtils.error('导出数据失败');
                return;
            }

            const filename = `tasks_export_${DateUtils.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
            FileUtils.download(exportData, filename);
            
            NotificationUtils.success('数据导出成功');
        } catch (error) {
            console.error('导出数据时出错:', error);
            NotificationUtils.error('导出数据时出现错误');
        }
    }

    /**
     * 显示设置模态框
     */
    showSettingsModal() {
        const modal = DOM.get('#settingsModal');
        const themeToggle = DOM.get('#themeToggleSwitch');
        const themeLabel = DOM.get('#themeLabel');
        
        // 设置主题切换开关状态
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        themeToggle.checked = isDark;
        themeLabel.textContent = isDark ? '深色模式' : '浅色模式';
        
        // 更新应用信息
        this.updateSettingsInfo();
        
        // 设置事件监听器
        this.setupSettingsEventListeners();
        
        DOM.show(modal);
    }

    /**
     * 设置设置模态框的事件监听器
     */
    setupSettingsEventListeners() {
        // 主题切换
        const themeToggle = DOM.get('#themeToggleSwitch');
        const themeLabel = DOM.get('#themeLabel');
        
        // 移除之前的监听器
        themeToggle.replaceWith(themeToggle.cloneNode(true));
        const newThemeToggle = DOM.get('#themeToggleSwitch');
        
        DOM.on(newThemeToggle, 'change', (e) => {
            this.toggleTheme();
            themeLabel.textContent = e.target.checked ? '深色模式' : '浅色模式';
        });

        // 导出功能
        DOM.on(DOM.get('#showExportBtn'), 'click', () => {
            this.showExportModal();
        });

        // 导入功能
        DOM.on(DOM.get('#selectFileBtn'), 'click', () => {
            DOM.get('#importFileInput').click();
        });

        DOM.on(DOM.get('#importFileInput'), 'change', (e) => {
            const file = e.target.files[0];
            if (file) {
                DOM.get('#importBtn').disabled = false;
                DOM.get('#selectFileBtn').textContent = file.name;
            }
        });

        DOM.on(DOM.get('#importBtn'), 'click', () => {
            this.importData();
        });

        // 清除所有数据
        DOM.on(DOM.get('#clearAllDataBtn'), 'click', () => {
            this.showClearDataConfirm();
        });
    }

    /**
     * 更新设置信息
     */
    updateSettingsInfo() {
        DOM.get('#settingsTotalTasks').textContent = this.tasks.length;
        DOM.get('#settingsCompletedTasks').textContent = this.tasks.filter(task => task.completed).length;
        
        // 计算数据大小
        try {
            const dataStr = JSON.stringify({
                tasks: this.tasks,
                settings: this.settings
            });
            const sizeBytes = new Blob([dataStr]).size;
            const sizeKB = (sizeBytes / 1024).toFixed(2);
            DOM.get('#dataSize').textContent = `${sizeKB} KB`;
        } catch (error) {
            DOM.get('#dataSize').textContent = '计算失败';
        }
    }

    /**
     * 显示导出选择模态框
     */
    showExportModal() {
        const modal = DOM.get('#exportModal');
        
        // 生成任务列表
        this.renderExportTaskList();
        
        // 设置导出事件监听器
        this.setupExportEventListeners();
        
        DOM.show(modal);
    }

    /**
     * 渲染导出任务列表
     */
    renderExportTaskList() {
        const taskList = DOM.get('#exportTaskList');
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        taskList.innerHTML = sortedTasks.map(task => `
            <div class="export-task-item">
                <input 
                    type="checkbox" 
                    class="export-task-checkbox" 
                    id="export-${task.id}" 
                    data-task-id="${task.id}"
                    checked>
                <div class="export-task-info">
                    <div class="export-task-title">${StringUtils.escapeHtml(task.title)}</div>
                    <div class="export-task-meta">
                        <span class="export-task-status ${task.completed ? 'completed' : 'pending'}">
                            ${task.completed ? '已完成' : '未完成'}
                        </span>
                        <span>优先级: ${this.getPriorityText(task.priority)}</span>
                        <span>分类: ${this.getCategoryText(task.category)}</span>
                        ${task.dueDate ? `<span>截止: ${DateUtils.formatDate(task.dueDate)}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        this.updateExportSummary();
    }

    /**
     * 设置导出事件监听器
     */
    setupExportEventListeners() {
        // 复选框变化
        DOM.on(DOM.get('#exportTaskList'), 'change', (e) => {
            if (e.target.classList.contains('export-task-checkbox')) {
                this.updateExportSummary();
            }
        });

        // 全选/全不选等按钮
        DOM.on(DOM.get('#selectAllTasksBtn'), 'click', () => {
            this.setAllTasksSelection(true);
        });

        DOM.on(DOM.get('#selectNoneTasksBtn'), 'click', () => {
            this.setAllTasksSelection(false);
        });

        DOM.on(DOM.get('#selectCompletedTasksBtn'), 'click', () => {
            this.setTasksSelectionByStatus(true);
        });

        DOM.on(DOM.get('#selectPendingTasksBtn'), 'click', () => {
            this.setTasksSelectionByStatus(false);
        });

        // 确认导出
        DOM.on(DOM.get('#confirmExportBtn'), 'click', () => {
            this.confirmExport();
        });
    }

    /**
     * 设置所有任务的选择状态
     */
    setAllTasksSelection(selected) {
        const checkboxes = DOM.get('#exportTaskList').querySelectorAll('.export-task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
        });
        this.updateExportSummary();
    }

    /**
     * 根据状态设置任务选择
     */
    setTasksSelectionByStatus(completed) {
        const checkboxes = DOM.get('#exportTaskList').querySelectorAll('.export-task-checkbox');
        checkboxes.forEach(checkbox => {
            const taskId = checkbox.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            checkbox.checked = task && task.completed === completed;
        });
        this.updateExportSummary();
    }

    /**
     * 更新导出摘要
     */
    updateExportSummary() {
        const checkboxes = DOM.get('#exportTaskList').querySelectorAll('.export-task-checkbox:checked');
        const count = checkboxes.length;
        DOM.get('#selectedTasksCount').textContent = `已选择 ${count} 个任务`;
        
        const exportBtn = DOM.get('#confirmExportBtn');
        exportBtn.disabled = count === 0;
    }

    /**
     * 确认导出选中的任务
     */
    confirmExport() {
        const selectedCheckboxes = DOM.get('#exportTaskList').querySelectorAll('.export-task-checkbox:checked');
        const selectedTaskIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.taskId);
        const selectedTasks = this.tasks.filter(task => selectedTaskIds.includes(task.id));

        if (selectedTasks.length === 0) {
            NotificationUtils.warning('请选择要导出的任务');
            return;
        }

        try {
            const data = {
                tasks: selectedTasks,
                settings: this.settings,
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                selectedCount: selectedTasks.length,
                totalCount: this.tasks.length
            };
            
            const filename = `tasks_export_${DateUtils.formatDate(new Date(), 'YYYY-MM-DD')}.json`;
            FileUtils.downloadJSON(data, filename);
            NotificationUtils.success(`成功导出 ${selectedTasks.length} 个任务！`);
            
            // 关闭模态框
            DOM.hide(DOM.get('#exportModal'));
            DOM.hide(DOM.get('#settingsModal'));
        } catch (error) {
            console.error('导出数据失败:', error);
            NotificationUtils.error('导出数据失败，请重试。');
        }
    }

    /**
     * 导入数据
     */
    importData() {
        const fileInput = DOM.get('#importFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            NotificationUtils.warning('请选择要导入的文件');
            return;
        }

        if (!file.name.endsWith('.json')) {
            NotificationUtils.error('请选择JSON格式的文件');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!data.tasks || !Array.isArray(data.tasks)) {
                    throw new Error('无效的数据格式：缺少tasks数组');
                }

                // 处理导入的任务
                const importedTasks = data.tasks.map(taskData => {
                    // 验证必要字段
                    if (!taskData.title) {
                        throw new Error('任务缺少标题');
                    }

                    // 创建新的任务ID以避免冲突
                    const newId = this.generateTaskId();
                    
                    return new Task({
                        ...taskData,
                        id: newId,
                        createdAt: taskData.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                });

                // 询问是否覆盖现有数据
                const shouldReplace = confirm(
                    `即将导入 ${importedTasks.length} 个任务。\n\n` +
                    `选择"确定"将替换所有现有任务\n` +
                    `选择"取消"将添加到现有任务中`
                );

                if (shouldReplace) {
                    this.tasks = importedTasks;
                } else {
                    this.tasks.push(...importedTasks);
                }

                // 保存数据
                this.storage.saveTasks(this.tasks);
                
                // 更新显示
                this.applyFilters();
                this.updateStats();
                this.updateSettingsInfo();

                NotificationUtils.success(`成功导入 ${importedTasks.length} 个任务！`);
                
                // 重置文件输入
                fileInput.value = '';
                DOM.get('#importBtn').disabled = true;
                DOM.get('#selectFileBtn').textContent = '选择文件';
                
            } catch (error) {
                console.error('导入数据失败:', error);
                NotificationUtils.error(`导入失败：${error.message}`);
            }
        };

        reader.onerror = () => {
            NotificationUtils.error('读取文件失败');
        };

        reader.readAsText(file);
    }

    /**
     * 生成新的任务ID
     */
    generateTaskId() {
        let newId;
        do {
            newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        } while (this.tasks.some(task => task.id === newId));
        return newId;
    }



    /**
     * 显示清除数据确认弹窗
     */
    showClearDataConfirm() {
        const confirmModal = DOM.get('#clearDataConfirm');
        DOM.show(confirmModal);
        
        // 禁用页面滚动
        document.body.style.overflow = 'hidden';
        
        // 为确认弹窗添加事件监听器
        this.setupClearDataConfirmEvents();
        
        // 焦点管理 - 聚焦到取消按钮
        setTimeout(() => {
            const cancelBtn = DOM.get('#cancelClearData');
            if (cancelBtn) {
                cancelBtn.focus();
            }
        }, 100);
    }

    /**
     * 隐藏清除数据确认弹窗
     */
    hideClearDataConfirm() {
        const confirmModal = DOM.get('#clearDataConfirm');
        DOM.hide(confirmModal);
        
        // 恢复页面滚动
        document.body.style.overflow = '';
        
        // 清理事件监听器
        const cancelBtn = DOM.get('#cancelClearData');
        const confirmBtn = DOM.get('#confirmClearData');
        
        if (this.clearDataConfirmHandler) {
            DOM.off(confirmBtn, 'click', this.clearDataConfirmHandler);
            DOM.off(cancelBtn, 'click', this.clearDataCancelHandler);
            DOM.off(confirmModal, 'click', this.clearDataOverlayHandler);
            DOM.off(document, 'keydown', this.clearDataKeyHandler);
        }
    }

    /**
     * 设置清除数据确认弹窗的事件监听器
     */
    setupClearDataConfirmEvents() {
        const confirmModal = DOM.get('#clearDataConfirm');
        const cancelBtn = DOM.get('#cancelClearData');
        const confirmBtn = DOM.get('#confirmClearData');

        // 移除之前的事件监听器（避免重复绑定）
        if (this.clearDataConfirmHandler) {
            DOM.off(confirmBtn, 'click', this.clearDataConfirmHandler);
            DOM.off(cancelBtn, 'click', this.clearDataCancelHandler);
            DOM.off(confirmModal, 'click', this.clearDataOverlayHandler);
            DOM.off(document, 'keydown', this.clearDataKeyHandler);
        }

        // 确认清除
        this.clearDataConfirmHandler = () => {
            this.hideClearDataConfirm();
            this.clearAllData();
        };

        // 取消清除
        this.clearDataCancelHandler = () => {
            this.hideClearDataConfirm();
        };

        // 点击遮罩层关闭
        this.clearDataOverlayHandler = (e) => {
            if (e.target === confirmModal) {
                this.hideClearDataConfirm();
            }
        };

        // ESC键关闭
        this.clearDataKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideClearDataConfirm();
            }
        };

        DOM.on(confirmBtn, 'click', this.clearDataConfirmHandler);
        DOM.on(cancelBtn, 'click', this.clearDataCancelHandler);
        DOM.on(confirmModal, 'click', this.clearDataOverlayHandler);
        DOM.on(document, 'keydown', this.clearDataKeyHandler);
    }

    /**
     * 清除所有数据
     */
    clearAllData() {
        try {
            // 清除本地存储
            const success = this.storage.clearAllData();
            
            if (success) {
                // 重置应用状态
                this.tasks = [];
                this.filteredTasks = [];
                this.settings = this.storage.getDefaultSettings();
                this.currentTask = null;
                this.currentFilter = {
                    search: '',
                    status: 'all',
                    priority: 'all',
                    category: 'all'
                };
                this.sortMode = 'time_priority';

                // 更新界面
                this.applyFilters();
                this.updateStats();
                this.updateSettingsInfo();
                this.applyTheme();

                // 重置搜索和筛选控件
                const searchInput = DOM.get('#searchInput');
                const statusFilter = DOM.get('#statusFilter');
                const priorityFilter = DOM.get('#priorityFilter');
                const categoryFilter = DOM.get('#categoryFilter');
                const sortMode = DOM.get('#sortMode');
                
                if (searchInput) searchInput.value = '';
                if (statusFilter) statusFilter.value = 'all';
                if (priorityFilter) priorityFilter.value = 'all';
                if (categoryFilter) categoryFilter.value = 'all';
                if (sortMode) sortMode.value = 'time_priority';

                // 重置文件输入
                const fileInput = DOM.get('#importFileInput');
                const importBtn = DOM.get('#importBtn');
                const selectFileBtn = DOM.get('#selectFileBtn');
                
                if (fileInput) {
                    fileInput.value = '';
                }
                if (importBtn) {
                    importBtn.disabled = true;
                }
                if (selectFileBtn) {
                    selectFileBtn.textContent = '选择文件';
                }

                // 关闭设置模态框
                const settingsModal = DOM.get('#settingsModal');
                if (settingsModal) {
                    DOM.hide(settingsModal);
                }

                NotificationUtils.success('所有数据已清除！');
                
                // 显示欢迎消息
                setTimeout(() => {
                    NotificationUtils.info('数据已清除，你可以重新开始创建任务。');
                }, 1500);
            } else {
                NotificationUtils.error('清除数据失败，请重试');
            }
        } catch (error) {
            console.error('清除数据时出错:', error);
            NotificationUtils.error('清除数据时出现错误');
        }
    }

    /**
     * 获取优先级文本
     */
    getPriorityText(priority) {
        const priorityMap = {
            'high': '高',
            'medium': '中',
            'low': '低'
        };
        return priorityMap[priority] || priority;
    }

    /**
     * 获取分类文本
     */
    getCategoryText(category) {
        const categoryMap = {
            'work': '工作',
            'personal': '个人',
            'study': '学习',
            'other': '其他'
        };
        return categoryMap[category] || category;
    }

    /**
     * 获取剩余天数显示文本
     */
    getRemainingDaysDisplay(task) {
        const remainingDays = task.getRemainingDays();
        
        if (remainingDays === Infinity) return '';
        
        let displayText = '';
        let className = 'task-remaining-days';
        
        if (remainingDays < 0) {
            displayText = `逾期${Math.abs(remainingDays)}天`;
            className += ' overdue';
        } else if (remainingDays === 0) {
            displayText = '今天到期';
            className += ' today';
        } else if (remainingDays === 1) {
            displayText = '明天到期';
            className += ' urgent';
        } else if (remainingDays <= 3) {
            displayText = `${remainingDays}天后到期`;
            className += ' urgent';
        } else {
            displayText = `${remainingDays}天后到期`;
            className += ' normal'; // >=4天的都使用绿色样式
        }
        
        return `<span class="${className}">
            <span class="material-icons">event</span>
            ${displayText}
        </span>`;
    }
}

// 当 DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
    
    // 开发模式下，将一些对象暴露到全局作用域以便调试
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        window.Task = Task;
        window.StorageManager = StorageManager;
        window.DOM = DOM;
        window.DateUtils = DateUtils;
        window.StringUtils = StringUtils;
        window.NotificationUtils = NotificationUtils;
        window.FileUtils = FileUtils;
    }
});

// 防止页面意外刷新时丢失数据的提示
let hasUnsavedChanges = false;

// 当用户尝试关闭页面时显示确认对话框（如果有未保存的更改）
window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
        const message = '你有未保存的更改，确定要离开此页面吗？';
        e.preventDefault();
        e.returnValue = message;
        return message;
    }
}); 