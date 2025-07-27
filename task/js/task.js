/**
 * 任务类 - 定义任务对象的结构和方法
 */
class Task {
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.description = data.description || '';
        this.completed = data.completed || false;
        this.priority = data.priority || 'medium';
        this.category = data.category || 'other';
        this.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
        this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    }

    /**
     * 生成唯一ID
     */
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 更新任务
     */
    update(data) {
        Object.keys(data).forEach(key => {
            if (key !== 'id' && key !== 'createdAt' && this.hasOwnProperty(key)) {
                this[key] = data[key];
            }
        });
        this.updatedAt = new Date();
        return this;
    }

    /**
     * 切换完成状态
     */
    toggleCompleted() {
        this.completed = !this.completed;
        this.updatedAt = new Date();
        return this;
    }

    /**
     * 检查是否逾期
     */
    isOverdue() {
        if (!this.dueDate || this.completed) return false;
        return new Date() > this.dueDate;
    }

    /**
     * 获取剩余天数
     */
    getRemainingDays() {
        if (!this.dueDate) return Infinity; // 没有截止日期的任务排在最后
        
        const now = new Date();
        const due = new Date(this.dueDate);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays; // 逾期任务返回负数，会自动排在最前面
    }

    /**
     * 获取优先级数值（用于排序）
     */
    getPriorityValue() {
        const priorities = { high: 3, medium: 2, low: 1 };
        return priorities[this.priority] || 1;
    }

    /**
     * 获取分类的中文名称
     */
    getCategoryName() {
        const categories = {
            work: '工作',
            personal: '个人',
            study: '学习',
            other: '其他'
        };
        return categories[this.category] || '其他';
    }

    /**
     * 获取优先级的中文名称
     */
    getPriorityName() {
        const priorities = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return priorities[this.priority] || '中';
    }

    /**
     * 格式化截止日期
     */
    getFormattedDueDate() {
        if (!this.dueDate) return '';
        
        const now = new Date();
        const due = new Date(this.dueDate);
        const diffTime = due - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return '今天到期';
        } else if (diffDays === 1) {
            return '明天到期';
        } else if (diffDays === -1) {
            return '昨天到期';
        } else if (diffDays > 1) {
            return `${diffDays}天后到期`;
        } else {
            return `逾期${Math.abs(diffDays)}天`;
        }
    }

    /**
     * 检查任务是否匹配搜索条件
     */
    matchesSearch(searchTerm) {
        if (!searchTerm) return true;
        
        const term = searchTerm.toLowerCase();
        return this.title.toLowerCase().includes(term) ||
               this.description.toLowerCase().includes(term) ||
               this.getCategoryName().toLowerCase().includes(term);
    }

    /**
     * 转换为JSON对象
     */
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            completed: this.completed,
            priority: this.priority,
            category: this.category,
            dueDate: this.dueDate ? this.dueDate.toISOString() : null,
            createdAt: this.createdAt.toISOString(),
            updatedAt: this.updatedAt.toISOString()
        };
    }

    /**
     * 从JSON对象创建Task实例
     */
    static fromJSON(json) {
        return new Task(json);
    }

    /**
     * 验证任务数据
     */
    static validate(data) {
        const errors = [];
        
        if (!data.title || data.title.trim().length === 0) {
            errors.push('任务标题不能为空');
        }
        
        if (data.title && data.title.length > 100) {
            errors.push('任务标题不能超过100个字符');
        }
        
        if (data.description && data.description.length > 500) {
            errors.push('任务描述不能超过500个字符');
        }
        
        if (data.priority && !['high', 'medium', 'low'].includes(data.priority)) {
            errors.push('无效的优先级');
        }
        
        if (data.category && !['work', 'personal', 'study', 'other'].includes(data.category)) {
            errors.push('无效的分类');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
} 