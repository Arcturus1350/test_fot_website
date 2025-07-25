window.onload = function() {
    alert('AI训练营 Arcturus1350！');
    document.getElementById('join-btn').onclick = function() {
        alert('感谢你的关注，敬请期待更多精彩内容！');
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