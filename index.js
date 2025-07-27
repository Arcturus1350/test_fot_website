window.onload = function() {
    // 抽奖活动按钮
    document.getElementById('lucky-btn').onclick = function() {
        window.location.href = './lucky/';
    };
    
    // 任务管理按钮
    document.getElementById('task-btn').onclick = function() {
        window.location.href = './task/';
    };
    
    // 番茄时钟按钮
    document.getElementById('tomato-btn').onclick = function() {
        window.location.href = './tomato/';
    };
};

// 全屏雪花特效
function createSnowFlake() {
    const snow = document.createElement('div');
    snow.className = 'snowflake';
    
    // 随机位置（确保全屏覆盖）
    snow.style.left = Math.random() * 100 + 'vw';
    
    // 随机动画时长（3-8秒）
    const duration = 3 + Math.random() * 5;
    snow.style.animationDuration = duration + 's';
    
    // 随机透明度
    snow.style.opacity = 0.6 + Math.random() * 0.4;
    
    // 随机大小
    snow.style.fontSize = (10 + Math.random() * 18) + 'px';
    
    // 随机雪花字符
    const snowChars = ['❄', '❅', '❆', '✻', '✼', '❋'];
    snow.innerText = snowChars[Math.floor(Math.random() * snowChars.length)];
    
    // 随机水平漂移
    const drift = -20 + Math.random() * 40;
    snow.style.setProperty('--drift', drift + 'px');
    
    document.body.appendChild(snow);
    
    // 动画完成后移除元素
    setTimeout(() => {
        if (snow.parentNode) {
            snow.remove();
        }
    }, (duration + 1) * 1000);
}

// 初始化雪花效果
function initSnowEffect() {
    // 创建初始雪花
    for (let i = 0; i < 15; i++) {
        setTimeout(() => createSnowFlake(), i * 100);
    }
    
    // 持续创建雪花
    setInterval(createSnowFlake, 150);
}

// 启动雪花效果
initSnowEffect(); 