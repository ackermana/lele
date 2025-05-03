// 导入Firebase相关模块
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// 全局变量
let score = 0; // 当前积分
let log = []; // 操作日志
let accompanyDays = 51; // 初始天数设置为51天
let theme = localStorage.getItem('theme') || 'pink'; // 默认主题：粉色
let speechBubble = null; // 用于存储对话气泡元素的引用
let startDate = new Date('2025-03-14T12:00:00'); // 设置为2025年3月14日中午12点

// 显示特殊消息的全局函数
function showSpecialMessage(points) {
  if (!speechBubble) return;
  
  if (points > 0) {
    const messages = [
      "加分了！！主人你真好！",
      "主人最棒了~加分！",
      "好开心，又加分啦！",
      "谢谢主人奖励我~",
      "汪汪！主人对我真好！",
      "我会更乖的！",
      "主人是世界上最好的！",
      "开心得尾巴摇不停~"
    ];
    speechBubble.textContent = messages[Math.floor(Math.random() * messages.length)];
    speechBubble.style.color = "#4CAF50"; // 绿色表示加分
    speechBubble.style.backgroundColor = "#E8F5E9"; // 浅绿色背景
  } else if (points < 0) {
    const messages = [
      "为什么扣小狗分？",
      "呜呜，我会改正的...",
      "对不起主人，我错了",
      "不要生气啦主人~",
      "我会好好表现的...",
      "主人别扣分好不好？",
      "我保证下次不会了",
      "扣分好难过呜呜~"
    ];
    speechBubble.textContent = messages[Math.floor(Math.random() * messages.length)];
    speechBubble.style.color = "#F44336"; // 红色表示扣分
    speechBubble.style.backgroundColor = "#FFEBEE"; // 浅红色背景
  } else {
    // 普通消息没有颜色
    speechBubble.style.color = ""; 
    speechBubble.style.backgroundColor = "";
  }
  speechBubble.style.opacity = "1";
  speechBubble.style.padding = "8px 12px";
  speechBubble.style.borderRadius = "12px";
  speechBubble.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
  
  setTimeout(() => {
    speechBubble.style.opacity = "0";
  }, 6000);
}

// Firebase配置信息
const firebaseConfig = {
  apiKey: "AIzaSyAWIdKwbQBX5-GTfMwb_El4991OXK-_Bfw",
  authDomain: "puppy-5443b.firebaseapp.com",
  databaseURL: "https://puppy-5443b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "puppy-5443b",
  storageBucket: "puppy-5443b.firebasestorage.app",
  messagingSenderId: "548254394160",
  appId: "1:548254394160:web:268692ff52ecf641adcaf5",
  measurementId: "G-T0X1YL9RXX"
};

// 初始化Firebase应用
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase应用初始化成功");
  } else {
    app = getApp(); // 获取已存在的默认应用
    console.log("获取已存在的Firebase应用");
  }
} catch (error) {
  console.error("Firebase初始化错误:", error);
}

// 获取数据库实例
const database = getDatabase(app);

// 保存天数到 Firebase
function saveDays() {
  try {
    set(ref(database, 'lele/accompanyDays'), accompanyDays)
      .then(() => {
        console.log("陪伴天数保存成功!");
      })
      .catch((error) => {
        console.error("保存陪伴天数时出错:", error);
      });
  } catch (error) {
    console.error("保存陪伴天数时发生错误:", error);
  }
}

// 从 Firebase 读取积分
function loadScore() {
  console.log("正在从 Firebase 加载数据...");
  
  try {
    const scoreRef = ref(database, 'lele/score');  // 修改路径，使用唯一标识符
    onValue(scoreRef, (snapshot) => {
      const val = snapshot.val();
      console.log("加载到积分:", val);
      score = val || 0;
      updateDisplay();
    }, (error) => {
      console.error("读取积分时出错:", error);
      // 添加错误处理，显示错误信息
      document.getElementById('totalScore').textContent = `当前积分：${score} (加载失败)`;
    });
    
    const logRef = ref(database, 'lele/log');  // 修改路径，使用唯一标识符
    onValue(logRef, (snapshot) => {
      const val = snapshot.val();
      console.log("加载到日志:", val);
      log = val || [];
      updateDisplay();
    }, (error) => {
      console.error("读取日志时出错:", error);
      // 添加错误处理
      document.getElementById('log').innerHTML = '<div style="color:red">日志加载失败</div>';
    });
    
    // 加载陪伴天数
    const daysRef = ref(database, 'lele/accompanyDays');
    onValue(daysRef, (snapshot) => {
      const val = snapshot.val();
      console.log("加载到陪伴天数:", val);
      if (val) {
        accompanyDays = val;
      }
      updateDaysDisplay();
    }, (error) => {
      console.error("读取陪伴天数时出错:", error);
    });
  } catch (error) {
    console.error("加载数据时发生错误:", error);
  }
}

// 更新天数显示
function updateDaysDisplay() {
  const daysElement = document.getElementById('accompanyDays');
  if (daysElement) {
    // 计算具体的时分秒
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - accompanyDays);
    
    const now = new Date();
    const diffTime = Math.abs(now - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffTime % (1000 * 60)) / 1000);
    
    daysElement.innerHTML = `
      <span class="days-count">${diffDays}</span>天 
      <span class="time-count">${String(diffHours).padStart(2, '0')}:${String(diffMinutes).padStart(2, '0')}:${String(diffSeconds).padStart(2, '0')}</span>
    `;
  }
}

// 更新时钟
function updateClock() {
  const clockElement = document.getElementById('clock');
  if (clockElement) {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    clockElement.textContent = `${hours}:${minutes}:${seconds}`;
  }
  
  // 同时更新天数显示
  updateDaysDisplay();
}

// 检查并更新天数
function checkAndUpdateDays() {
  const now = new Date();
  const lastUpdateKey = 'lastDayUpdate';
  
  // 获取上次更新的日期
  const lastUpdate = localStorage.getItem(lastUpdateKey);
  const today = now.toDateString();
  
  // 如果是新的一天（过了午夜）
  if (lastUpdate !== today && now.getHours() >= 0) {
    accompanyDays++;
    localStorage.setItem(lastUpdateKey, today);
    updateDaysDisplay();
    saveDays();
    
    // 在小狗对话中添加一条关于天数的消息
    const puppy = document.getElementById('cute-puppy');
    const speechBubble = document.getElementById('puppy-speech-bubble');
    if (puppy && speechBubble) {
      speechBubble.textContent = `今天是我们在一起的第 ${accompanyDays} 天啦！`;
      speechBubble.style.opacity = "1";
      
      setTimeout(() => {
        speechBubble.style.opacity = "0";
      }, 5000);
    }
  }
}

// 保存积分到 Firebase
function saveScore() {
  console.log("正在保存数据到 Firebase...");
  
  try {
    // 添加状态指示
    const statusElem = document.createElement('div');
    statusElem.id = 'saveStatus';
    statusElem.style.position = 'fixed';
    statusElem.style.bottom = '10px';
    statusElem.style.right = '10px';
    statusElem.style.padding = '5px 10px';
    statusElem.style.background = '#ffe6e6';
    statusElem.style.borderRadius = '5px';
    statusElem.style.fontSize = '12px';
    statusElem.textContent = '正在保存...';
    document.body.appendChild(statusElem);
    
    set(ref(database, 'lele/score'), score)  // 修改路径，使用唯一标识符
      .then(() => {
        console.log("积分保存成功!");
        statusElem.style.background = '#e6ffe6';
        statusElem.textContent = '保存成功!';
        setTimeout(() => {
          if (document.body.contains(statusElem)) {
            document.body.removeChild(statusElem);
          }
        }, 2000);
      })
      .catch((error) => {
        console.error("保存积分时出错:", error);
        statusElem.style.background = '#ffe6e6';
        statusElem.textContent = '保存失败!';
        setTimeout(() => {
          if (document.body.contains(statusElem)) {
            document.body.removeChild(statusElem);
          }
        }, 2000);
      });
      
    set(ref(database, 'lele/log'), log)  // 修改路径，使用唯一标识符
      .then(() => {
        console.log("日志保存成功!");
      })
      .catch((error) => {
        console.error("保存日志时出错:", error);
      });
  } catch (error) {
    console.error("保存数据时发生错误:", error);
  }
}

// 更新显示
function updateDisplay() {
  document.getElementById('totalScore').textContent = `当前积分：${score}`;
  document.getElementById('log').innerHTML = log
    .slice(-10).reverse().map(entry => 
      `<div class="log-entry">
        <div class="log-time">${new Date(entry.time).toLocaleDateString()} ${new Date(entry.time).toLocaleTimeString()}</div>
        <div class="log-content">
          <span class="log-action">${entry.action}</span>
          <span class="badge ${entry.points > 0 ? 'badge-add' : 'badge-deduct'}">${entry.points > 0 ? '+' : ''}${entry.points}</span>
        </div>
      </div>`
    ).join('');
}

// 移除这两个部分
// function togglePanel(id) {
//   const panel = document.getElementById(id);
//   const icon = panel.previousElementSibling.querySelector('i');
//   panel.style.maxHeight = panel.style.maxHeight ? null : panel.scrollHeight + "px";
//   icon.classList.toggle('fa-chevron-up');
// }

// // 将函数暴露到全局作用域
// window.togglePanel = togglePanel;

function createButton(type, item) {
  const btn = document.createElement('button');
  btn.className = `btn ${type}-btn`;
  btn.innerHTML = `
    <div style="text-align:left">
      <div>${item.name}</div>
      ${item.desc ? `<small style="color:#666">${item.desc}</small>` : ''}
    </div>
    <span>${item.points || item.cost}分</span>
  `;
  
  btn.onclick = () => {
    let points = 0;
    if(type === 'store') {
      if(score >= item.cost) {
        points = -item.cost;
        score += points;
        log.push({time: Date.now(), action: `兑换 ${item.name}`, points});
        saveScore(); // 保存到 Firebase
        showSpecialMessage(points); // 显示特殊消息
      }
    } else {
      points = type === 'add' ? item.points : -item.points;
      score += points;
      log.push({time: Date.now(), action: item.name, points});
      saveScore(); // 保存到 Firebase
      showSpecialMessage(points); // 显示特殊消息
    }
    updateDisplay();
  };
  return btn;
}

const rules = {
  deductions: [
    {name: "没有早安吻、晚安吻", points: 20, desc: "每天"},
    {name: "没有及时报备", points: 20},
    {name: "睡前没有说爱主人", points: 20},
    {name: "敷衍主人", points: 30},
    {name: "自己偷偷生气", points: 40, desc: "罚"},
    {name: "有误会不及时解决", points: 20, desc: "隔夜40分+罚"},
    {name: "没有完成主人的任务", points: 10, desc: "说到不做到，最高40分"},
    {name: "不完成主人的惩罚", points: 40, desc: "重罚！！最高80分"},
    {name: "其他惹主人生气行为", points: 10, desc: "无上限"}
  ],
  additions: [
    {name: "一天表现良好", points: 10, desc: "上限30"},
    {name: "及时报备", points: 10, desc: "每天上限20"},
    {name: "发语音", points: 10, desc: "每天上限20分"},
    {name: "发照片", points: 10, desc: "每天上限30分"},
    {name: "发视频", points: 10, desc: "每天上限40分+奖"},
    {name: "打电话", points: 10, desc: "每天上限40分+奖"},
    {name: "一天黏主人", points: 10},
    {name: "涩涩后细说过程", points: 20},
    {name: "超额完成主人任务", points: 20, desc: "+奖"},
    {name: "其他让主人高兴行为", points: 10, desc: "无上限"}
  ],
  store: [
    {name: "抱抱", cost: 0},
    {name: "亲亲", cost: 0},
    {name: "摸摸它", cost: 10},
    {name: "主人照片", cost: 30},
    {name: "文字涩涩", cost: 40, desc: "次数：数不清了"},
    {name: "语音涩涩", cost: 60, desc: "次数：3/10"},
    {name: "神秘礼物", cost: 300, desc: "每次兑换加100"}
  ]
};

// 页面加载完成后初始化
window.onload = function() {
  // 初始化所有按钮
  Object.keys(rules).forEach(type => {
    const container = document.getElementById(type === 'store' ? 'store' : type);
    rules[type].forEach(item => {
      container.appendChild(createButton(
        type === 'store' ? 'store' : type === 'additions' ? 'add' : 'deduct',
        item
      ));
    });
  });

  // 加载Firebase数据
  loadScore();
  
  // 初始化天数显示
  updateDaysDisplay();
  
  // 检查并更新天数
  checkAndUpdateDays();
  
  // 设置每小时检查一次是否过了午夜
  setInterval(checkAndUpdateDays, 60 * 60 * 1000);

  // 初始化小狗功能
  initPuppy();
  
  // 应用保存的主题
  switchTheme(theme);
  
  // 初始化主题切换按钮
  initThemeButtons();
  
  // 初始化成就系统
  initAchievements();
  
  // 初始化心情系统
  initMoodSystem();
  
  // 初始化实时时钟
  updateClock();
  setInterval(updateClock, 1000);
};

// 初始化主题切换按钮
function initThemeButtons() {
  const themeContainer = document.getElementById('theme-switcher');
  if (themeContainer) {
    const themes = [
      { name: 'pink', icon: '🌸', label: '粉色' },
      { name: 'blue', icon: '🌊', label: '蓝色' },
      { name: 'green', icon: '🍀', label: '绿色' }
    ];
    
    themes.forEach(t => {
      const btn = document.createElement('button');
      btn.className = `theme-btn ${theme === t.name ? 'active' : ''}`;
      btn.innerHTML = `${t.icon} ${t.label}`;
      btn.style.padding = '10px 20px';
      btn.style.borderRadius = '25px';
      btn.style.border = 'none';
      btn.style.margin = '0 5px';
      btn.style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
      btn.style.transition = 'transform 0.3s, box-shadow 0.3s';
      btn.style.background = 'linear-gradient(to right, #fff0f5, #f0f8ff)';
      btn.onclick = () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        switchTheme(t.name);
      };
      themeContainer.appendChild(btn);
    });
  }
}

// 小狗功能初始化
function initPuppy() {
  const puppy = document.getElementById('cute-puppy');
  speechBubble = document.getElementById('puppy-speech-bubble'); // 将引用保存到全局变量
  const puppyImage = document.getElementById('puppy-image');
  
  // 小狗可能说的话
  const puppyPhrases = [
    "汪~",
    "主人，小狗爱您！",
    "摸摸我嘛~",
    "今天表现好，可以加分吗？",
    "我会乖乖的~",
    "主人最好了~",
    "抱抱我嘛！~",
    "我想要亲亲~",
    "我会一直陪着主人~",
    "主人，我饿了~",
    "主人，我困了~",
    "乐乐最乖了！",
    "那可不~",
    "可以兑换奖励吗？",
  ];

  let dailyClickPoints = 0;



  // 随机显示对话泡泡
  function showRandomSpeech() {
    const randomPhrase = puppyPhrases[Math.floor(Math.random() * puppyPhrases.length)];
    speechBubble.textContent = randomPhrase;
    speechBubble.style.opacity = "1";
    
    setTimeout(() => {
      speechBubble.style.opacity = "0";
    }, 5000); // 将消息持续时间延长至5秒
  }
  
  // 初始随机时间后显示第一句话
  setTimeout(showRandomSpeech, Math.random() * 5000 + 2000);
  
  // 定期随机说话
  setInterval(showRandomSpeech, Math.random() * 20000 + 15000);
  
  // 点击小狗时的交互
  puppy.addEventListener('click', () => {
    if (dailyClickPoints < 20) { // 检查当天点击获得的积分是否超过20
      // 15%的概率获得奖励
      if (Math.random() < 0.25) {
        // 根据概率分配积分，低分数概率高
        const randomPoints = getRandomPoints();
        score += randomPoints;
        dailyClickPoints += randomPoints;
        log.push({time: Date.now(), action: `点击小狗获得奖励`, points: randomPoints});
        saveScore();
        updateDisplay();
        showSpecialMessage(randomPoints); // 显示特殊消息
      }
    }
    // 显示随机对话
    showRandomSpeech();
    
    // 添加动画效果
    puppyImage.style.transform = "scale(1.2)";
    setTimeout(() => {
      puppyImage.style.transform = "scale(1)";
    }, 300);
  });
  
  // 小狗随机移动
  function randomMove() {
    const maxX = 40; // 最大水平移动范围
    const maxY = 20; // 最大垂直移动范围
    
    const randomX = Math.random() * maxX - maxX/2;
    const randomY = Math.random() * maxY - maxY/2;
    
    puppy.style.transform = `translate(${randomX}px, ${randomY}px)`;
    
    setTimeout(() => {
      puppy.style.transform = "translate(0, 0)";
    }, 500);
  }
  
  // 定期随机移动
  setInterval(randomMove, Math.random() * 10000 + 5000);
}

// 获取随机积分，调整概率分布
function getRandomPoints() {
  const probabilities = [0.15, 0.2, 0.2, 0.2, 0.15, 0.05, 0.05]; // 新的概率分布
  const points = [1, 2, 3, 4, 5, 6, 10]; // 对应的积分
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulativeProbability += probabilities[i];
    if (random < cumulativeProbability) {
      return points[i];
    }
  }
  return 1; // 默认返回1分
}

// 添加在文件顶部
let messageQueue = [];
let isShowingMessage = false;

function showMessage(text, duration) {
    messageQueue.push({text, duration});
    if (!isShowingMessage) {
        processMessageQueue();
    }
}

function processMessageQueue() {
    if (messageQueue.length === 0) {
        isShowingMessage = false;
        return;
    }
    
    isShowingMessage = true;
    const {text, duration} = messageQueue.shift();
    speechBubble.textContent = text;
    speechBubble.style.opacity = "1";
    
    setTimeout(() => {
        speechBubble.style.opacity = "0";
        setTimeout(() => processMessageQueue(), 500); // 淡出动画时间
    }, duration);
}

// 更新计时器显示
function updateAccompanyTimer() {
    const now = new Date();
    const diff = now - startDate;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    document.getElementById('accompanyDays').textContent = 
        `${days}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 初始化计时器
setInterval(updateAccompanyTimer, 1000);
updateAccompanyTimer(); // 立即更新一次

// 主题切换功能
function switchTheme(newTheme) {
  const root = document.documentElement;
  theme = newTheme;
  
  // 保存主题设置到本地存储
  localStorage.setItem('theme', theme);
  
  // 更新主题颜色
  switch(theme) {
    case 'pink':
      root.style.setProperty('--primary', '#ff7eb9');
      root.style.setProperty('--secondary', '#7afcff');
      root.style.setProperty('--bg', '#fff0f5');
      break;
    case 'blue':
      root.style.setProperty('--primary', '#1e90ff'); // 修改为更好看的蓝色
      root.style.setProperty('--secondary', '#ff9e80');
      root.style.setProperty('--bg', '#f0f8ff');
      break;
    case 'green':
      root.style.setProperty('--primary', '#66bb6a');
      root.style.setProperty('--secondary', '#ffcc80');
      root.style.setProperty('--bg', '#f1f8e9');
      break;
  }
  
  // 更新小狗对话
  const speechBubble = document.getElementById('puppy-speech-bubble');
  if (speechBubble) {
    speechBubble.textContent = `换了${theme === 'pink' ? '粉色' : theme === 'blue' ? '蓝色' : '绿色'}主题，好好看！`;
    speechBubble.style.opacity = "1";
    
    setTimeout(() => {
      speechBubble.style.opacity = "0";
    }, 3000);
  }
}