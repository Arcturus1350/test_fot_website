/**
 * 存储管理模块 - 处理本地存储的数据持久化
 */
class StorageManager {
    constructor() {
        this.storageKey = 'taskManagementSystem';
        this.settingsKey = 'taskManagementSettings';
    }

    /**
     * 保存所有任务到本地存储
     */
    saveTasks(tasks) {
        try {
            const data = {
                tasks: tasks.map(task => task.toJSON()),
                lastModified: new Date().toISOString(),
                version: '1.0.0'
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存任务失败:', error);
            return false;
        }
    }

    /**
     * 从本地存储加载所有任务
     */
    loadTasks() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return [];

            const parsedData = JSON.parse(data);
            
            // 兼容性检查
            if (Array.isArray(parsedData)) {
                // 旧版本数据格式
                return parsedData.map(taskData => Task.fromJSON(taskData));
            }
            
            // 新版本数据格式
            if (parsedData.tasks) {
                return parsedData.tasks.map(taskData => Task.fromJSON(taskData));
            }
            
            return [];
        } catch (error) {
            console.error('加载任务失败:', error);
            return [];
        }
    }

    /**
     * 保存单个任务
     */
    saveTask(task) {
        const tasks = this.loadTasks();
        const existingIndex = tasks.findIndex(t => t.id === task.id);
        
        if (existingIndex >= 0) {
            tasks[existingIndex] = task;
        } else {
            tasks.push(task);
        }
        
        return this.saveTasks(tasks);
    }

    /**
     * 删除任务
     */
    deleteTask(taskId) {
        const tasks = this.loadTasks();
        const filteredTasks = tasks.filter(task => task.id !== taskId);
        return this.saveTasks(filteredTasks);
    }

    /**
     * 获取任务统计信息
     */
    getTaskStats() {
        const tasks = this.loadTasks();
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const pending = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
            total,
            completed,
            pending,
            completionRate
        };
    }

    /**
     * 保存应用设置
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify({
                ...settings,
                lastModified: new Date().toISOString()
            }));
            return true;
        } catch (error) {
            console.error('保存设置失败:', error);
            return false;
        }
    }

    /**
     * 加载应用设置
     */
    loadSettings() {
        try {
            const data = localStorage.getItem(this.settingsKey);
            if (!data) {
                return this.getDefaultSettings();
            }

            const settings = JSON.parse(data);
            return { ...this.getDefaultSettings(), ...settings };
        } catch (error) {
            console.error('加载设置失败:', error);
            return this.getDefaultSettings();
        }
    }

    /**
     * 获取默认设置
     */
    getDefaultSettings() {
        return {
            theme: 'light',
            sortBy: 'created',
            sortOrder: 'desc',
            defaultCategory: 'other',
            defaultPriority: 'medium'
        };
    }

    /**
     * 导出数据
     */
    exportData() {
        try {
            const tasks = this.loadTasks();
            const settings = this.loadSettings();
            
            const exportData = {
                tasks: tasks.map(task => task.toJSON()),
                settings,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('导出数据失败:', error);
            return null;
        }
    }

    /**
     * 导入数据
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // 验证数据格式
            if (!data.tasks || !Array.isArray(data.tasks)) {
                throw new Error('无效的数据格式');
            }

            // 验证任务数据
            const tasks = data.tasks.map(taskData => {
                const validation = Task.validate(taskData);
                if (!validation.isValid) {
                    throw new Error(`任务数据无效: ${validation.errors.join(', ')}`);
                }
                return Task.fromJSON(taskData);
            });

            // 保存导入的任务
            const success = this.saveTasks(tasks);
            
            // 如果有设置数据，也一并导入
            if (data.settings) {
                this.saveSettings(data.settings);
            }

            return {
                success,
                taskCount: tasks.length,
                message: success ? '数据导入成功' : '数据导入失败'
            };
        } catch (error) {
            console.error('导入数据失败:', error);
            return {
                success: false,
                taskCount: 0,
                message: `导入失败: ${error.message}`
            };
        }
    }

    /**
     * 清空所有数据
     */
    clearAllData() {
        try {
            localStorage.removeItem(this.storageKey);
            localStorage.removeItem(this.settingsKey);
            return true;
        } catch (error) {
            console.error('清空数据失败:', error);
            return false;
        }
    }

    /**
     * 获取存储使用情况
     */
    getStorageInfo() {
        try {
            const tasks = localStorage.getItem(this.storageKey);
            const settings = localStorage.getItem(this.settingsKey);
            
            const taskSize = tasks ? new Blob([tasks]).size : 0;
            const settingsSize = settings ? new Blob([settings]).size : 0;
            const totalSize = taskSize + settingsSize;

            return {
                taskSize: this.formatBytes(taskSize),
                settingsSize: this.formatBytes(settingsSize),
                totalSize: this.formatBytes(totalSize),
                taskCount: this.loadTasks().length
            };
        } catch (error) {
            console.error('获取存储信息失败:', error);
            return null;
        }
    }

    /**
     * 格式化字节大小
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * 备份数据
     */
    createBackup() {
        const exportData = this.exportData();
        if (!exportData) return null;

        const backupName = `tasks_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        return {
            name: backupName,
            data: exportData,
            size: this.formatBytes(new Blob([exportData]).size)
        };
    }


} 