/**
 * 工具函数模块 - 提供通用的辅助功能
 */

/**
 * DOM操作工具
 */
const DOM = {
    /**
     * 获取元素
     */
    get(selector) {
        return document.querySelector(selector);
    },

    /**
     * 获取所有匹配的元素
     */
    getAll(selector) {
        return document.querySelectorAll(selector);
    },

    /**
     * 创建元素
     */
    create(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'dataset') {
                Object.keys(attributes[key]).forEach(dataKey => {
                    element.dataset[dataKey] = attributes[key][dataKey];
                });
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },

    /**
     * 添加事件监听器
     */
    on(element, event, handler) {
        if (element) {
            element.addEventListener(event, handler);
        }
    },

    /**
     * 移除事件监听器
     */
    off(element, event, handler) {
        if (element) {
            element.removeEventListener(event, handler);
        }
    },

    /**
     * 显示元素
     */
    show(element) {
        if (element) {
            element.style.display = '';
        }
    },

    /**
     * 隐藏元素
     */
    hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    },

    /**
     * 切换元素显示状态
     */
    toggle(element) {
        if (element) {
            if (element.style.display === 'none') {
                this.show(element);
            } else {
                this.hide(element);
            }
        }
    }
};

/**
 * 日期时间工具
 */
const DateUtils = {
    /**
     * 格式化日期
     */
    formatDate(date, format = 'YYYY-MM-DD') {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },

    /**
     * 格式化日期时间为本地时间字符串
     */
    formatDateTime(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        return d.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * 获取相对时间描述
     */
    getRelativeTime(date) {
        if (!date) return '';
        
        const now = new Date();
        const target = new Date(date);
        const diffTime = target - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));

        if (diffMinutes < 1) {
            return '刚刚';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}分钟后`;
        } else if (diffHours < 24) {
            return `${diffHours}小时后`;
        } else if (diffDays === 1) {
            return '明天';
        } else if (diffDays > 1) {
            return `${diffDays}天后`;
        } else if (diffDays === -1) {
            return '昨天';
        } else if (diffDays < -1) {
            return `${Math.abs(diffDays)}天前`;
        } else {
            return '今天';
        }
    },

    /**
     * 检查日期是否为今天
     */
    isToday(date) {
        if (!date) return false;
        
        const today = new Date();
        const target = new Date(date);
        
        return today.toDateString() === target.toDateString();
    },

    /**
     * 获取日期时间输入框的值格式
     */
    toInputValue(date) {
        if (!date) return '';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        
        // 转换为本地时间的 datetime-local 格式
        const offset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() - offset);
        return localDate.toISOString().slice(0, 16);
    }
};

/**
 * 字符串工具
 */
const StringUtils = {
    /**
     * 截断字符串
     */
    truncate(str, length = 50, suffix = '...') {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + suffix;
    },

    /**
     * 转义HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 移除HTML标签
     */
    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },

    /**
     * 首字母大写
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    /**
     * 生成随机字符串
     */
    randomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};

/**
 * 动画工具
 */
const AnimationUtils = {
    /**
     * 淡入动画
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * 淡出动画
     */
    fadeOut(element, duration = 300) {
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.opacity = 1 - Math.min(progress, 1);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * 滑动显示
     */
    slideDown(element, duration = 300) {
        element.style.display = 'block';
        const height = element.scrollHeight;
        element.style.height = '0';
        element.style.overflow = 'hidden';
        
        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = (timestamp - start) / duration;
            
            element.style.height = (height * Math.min(progress, 1)) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
                element.style.overflow = '';
            }
        };
        
        requestAnimationFrame(animate);
    }
};

/**
 * 通知工具
 */
const NotificationUtils = {
    /**
     * 显示成功消息
     */
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },

    /**
     * 显示错误消息
     */
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },

    /**
     * 显示警告消息
     */
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },

    /**
     * 显示信息消息
     */
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    },

    /**
     * 显示通知
     */
    show(message, type = 'info', duration = 3000) {
        // 创建通知容器（如果不存在）
        let container = DOM.get('.notification-container');
        if (!container) {
            container = DOM.create('div', { className: 'notification-container' });
            document.body.appendChild(container);
        }

        // 创建通知元素
        const notification = DOM.create('div', {
            className: `notification notification-${type}`
        }, `
            <span class="notification-message">${StringUtils.escapeHtml(message)}</span>
            <button class="notification-close">&times;</button>
        `);

        // 添加关闭事件
        const closeBtn = notification.querySelector('.notification-close');
        DOM.on(closeBtn, 'click', () => {
            this.remove(notification);
        });

        // 添加到容器
        container.appendChild(notification);

        // 显示动画
        AnimationUtils.fadeIn(notification, 200);

        // 自动关闭
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    },

    /**
     * 移除通知
     */
    remove(notification) {
        AnimationUtils.fadeOut(notification, 200);
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 200);
    }
};

/**
 * 文件工具
 */
const FileUtils = {
    /**
     * 下载文件
     */
    download(content, filename, contentType = 'application/json') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const link = DOM.create('a', {
            href: url,
            download: filename
        });
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    },

    /**
     * 读取文件
     */
    read(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => callback(e.target.result);
        reader.onerror = () => callback(null);
        reader.readAsText(file);
    },

    /**
     * 下载JSON文件
     */
    downloadJSON(data, filename) {
        const jsonContent = JSON.stringify(data, null, 2);
        this.download(jsonContent, filename, 'application/json');
    }
};

/**
 * 防抖函数
 */
function debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 自定义下拉选择器组件
 */
class CustomSelect {
    constructor(element, options = {}) {
        this.element = element;
        this.options = options;
        this.isOpen = false;
        this.selectedValue = element.value || element.dataset.value || '';
        this.selectedText = element.dataset.text || '';
        
        this.init();
    }

    init() {
        // 隐藏原始select
        this.element.style.display = 'none';
        
        // 创建自定义下拉
        this.createCustomSelect();
        
        // 绑定事件
        this.bindEvents();
        
        // 设置初始值
        this.updateDisplay();
    }

    createCustomSelect() {
        const selectOptions = Array.from(this.element.options || this.element.children);
        
        this.customSelect = DOM.create('div', {
            className: 'custom-select'
        });

        this.selectButton = DOM.create('button', {
            className: 'select-button',
            type: 'button',
            'aria-haspopup': 'listbox',
            'aria-expanded': 'false',
            'role': 'combobox'
        });

        this.dropdownMenu = DOM.create('div', {
            className: 'dropdown-menu',
            'role': 'listbox',
            'aria-label': '选择选项'
        });

        // 创建选项
        let hasSelected = false;
        selectOptions.forEach((option, index) => {
            const value = option.value || option.dataset.value || '';
            const text = option.textContent || option.dataset.text || '';
            
            const optionElement = DOM.create('div', {
                className: 'dropdown-option',
                dataset: { value: value, index: index },
                'role': 'option',
                'tabindex': '-1'
            }, text);

            // 如果找到匹配的值或者是第一个选项且没有设置初始值
            if (value === this.selectedValue || (!hasSelected && !this.selectedValue && index === 0)) {
                optionElement.classList.add('selected');
                optionElement.setAttribute('aria-selected', 'true');
                this.selectedText = text;
                this.selectedValue = value;
                hasSelected = true;
                
                // 更新原始select的值
                this.element.value = value;
            } else {
                optionElement.setAttribute('aria-selected', 'false');
            }

            this.dropdownMenu.appendChild(optionElement);
        });

        this.customSelect.appendChild(this.selectButton);
        this.customSelect.appendChild(this.dropdownMenu);
        
        // 插入到原始元素后面
        this.element.parentNode.insertBefore(this.customSelect, this.element.nextSibling);
    }

    bindEvents() {
        // 点击按钮切换下拉菜单
        DOM.on(this.selectButton, 'click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        // 点击选项
        DOM.on(this.dropdownMenu, 'click', (e) => {
            if (e.target.classList.contains('dropdown-option')) {
                this.selectOption(e.target);
            }
        });

        // 点击外部关闭
        DOM.on(document, 'click', (e) => {
            if (!this.customSelect.contains(e.target)) {
                this.close();
            }
        });

        // 键盘支持
        DOM.on(this.selectButton, 'keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggle();
            } else if (e.key === 'Escape') {
                this.close();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!this.isOpen) {
                    this.open();
                }
                this.focusNextOption();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!this.isOpen) {
                    this.open();
                }
                this.focusPreviousOption();
            }
        });

        // 下拉菜单键盘导航
        DOM.on(this.dropdownMenu, 'keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (e.target.classList.contains('dropdown-option')) {
                    this.selectOption(e.target);
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.focusNextOption();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.focusPreviousOption();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
                this.selectButton.focus();
            }
        });
    }

    selectOption(optionElement) {
        const value = optionElement.dataset.value;
        const text = optionElement.textContent;

        // 更新选中状态
        this.dropdownMenu.querySelectorAll('.dropdown-option').forEach(opt => {
            opt.classList.remove('selected');
            opt.setAttribute('aria-selected', 'false');
        });
        optionElement.classList.add('selected');
        optionElement.setAttribute('aria-selected', 'true');

        // 更新值
        this.selectedValue = value;
        this.selectedText = text;
        this.element.value = value;

        // 更新显示
        this.updateDisplay();

        // 触发change事件
        const changeEvent = new Event('change', { bubbles: true });
        this.element.dispatchEvent(changeEvent);

        // 关闭下拉菜单
        this.close();
    }

    updateDisplay() {
        this.selectButton.textContent = this.selectedText || '请选择...';
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.customSelect.classList.add('open');
        this.isOpen = true;
        this.selectButton.setAttribute('aria-expanded', 'true');
        
        // 聚焦到当前选中的选项
        setTimeout(() => {
            const selectedOption = this.dropdownMenu.querySelector('.dropdown-option.selected');
            if (selectedOption) {
                selectedOption.focus();
            } else {
                const firstOption = this.dropdownMenu.querySelector('.dropdown-option');
                if (firstOption) {
                    firstOption.focus();
                }
            }
        }, 50);
    }

    close() {
        this.customSelect.classList.remove('open');
        this.isOpen = false;
        this.selectButton.setAttribute('aria-expanded', 'false');
    }

    setValue(value) {
        const option = this.dropdownMenu.querySelector(`[data-value="${value}"]`);
        if (option) {
            this.selectOption(option);
        }
    }

    getValue() {
        return this.selectedValue;
    }

    focusNextOption() {
        const options = this.dropdownMenu.querySelectorAll('.dropdown-option');
        const currentIndex = Array.from(options).findIndex(opt => opt === document.activeElement);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        options[nextIndex].focus();
    }

    focusPreviousOption() {
        const options = this.dropdownMenu.querySelectorAll('.dropdown-option');
        const currentIndex = Array.from(options).findIndex(opt => opt === document.activeElement);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        options[prevIndex].focus();
    }

    destroy() {
        if (this.customSelect) {
            this.customSelect.remove();
        }
        this.element.style.display = '';
    }
} 