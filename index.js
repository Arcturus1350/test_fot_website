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

// 雪花特效
function createSnowFlake() {
    const snow = document.createElement('div');
    snow.className = 'snowflake';
    snow.style.left = Math.random() * 100 + 'vw';
    snow.style.animationDuration = (2 + Math.random() * 3) + 's';
    snow.style.opacity = Math.random();
    snow.style.fontSize = (12 + Math.random() * 16) + 'px';
    snow.innerText = '❄';
    document.body.appendChild(snow);
    setTimeout(() => {
        snow.remove();
    }, 5000);
}
setInterval(createSnowFlake, 200); 