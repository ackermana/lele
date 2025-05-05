// 导入Firebase相关模块
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
// 导入配置文件
import { firebaseConfig, ADMIN_PASSWORD, PUPPY_PASSWORD } from './config.js';

// ==================== 全局变量 ====================
let score = 0; // 当前积分
let log = []; // 操作日志
let accompanyDays = 51; // 初始天数设置为51天
let speechBubble = null; // 用于存储对话气泡元素的引用
let startDate = new Date('2025-03-14T12:00:00'); // 设置为2025年3月14日中午12点
let dailyTasks = []; // 添加每日任务数组

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

// ==================== 核心功能函数 ====================

// Firebase数据操作函数
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

function loadScore() {
  console.log("正在从 Firebase 加载数据...");
  
  // 添加加载状态指示
  document.getElementById('totalScore').textContent = `当前积分：加载中...`;
  document.getElementById('log').innerHTML = '<div style="text-align:center">加载中...</div>';
  
  try {
    // 加载积分
    const scoreRef = ref(database, 'lele/score');
    onValue(scoreRef, (snapshot) => {
      const val = snapshot.val();
      console.log("加载到积分:", val);
      score = val || 0;
      updateDisplay();
    }, (error) => {
      console.error("读取积分时出错:", error);
      document.getElementById('totalScore').textContent = `当前积分：${score} (加载失败，请刷新页面)`;
    });
    
    // 加载日志
    const logRef = ref(database, 'lele/log');
    onValue(logRef, (snapshot) => {
      const val = snapshot.val();
      console.log("加载到日志:", val);
      log = val || [];
      updateDisplay();
    }, (error) => {
      console.error("读取日志时出错:", error);
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
    
    // 加载每日任务
    const tasksRef = ref(database, 'lele/dailyTasks');
    onValue(tasksRef, (snapshot) => {
      const val = snapshot.val();
      console.log("加载到每日任务:", val);
      dailyTasks = val || [];
      renderDailyTasks();
    }, (error) => {
      console.error("读取每日任务时出错:", error);
    });
  } catch (error) {
    console.error("加载数据时发生错误:", error);
    document.getElementById('totalScore').textContent = `当前积分：${score} (加载失败)`;
    document.getElementById('log').innerHTML = '<div style="color:red">数据加载失败，请刷新页面重试</div>';
  }
}

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
    
    set(ref(database, 'lele/score'), score)
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
      
    set(ref(database, 'lele/log'), log)
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

function saveDailyTasks() {
  try {
    set(ref(database, 'lele/dailyTasks'), dailyTasks)
      .then(() => {
        console.log("每日任务保存成功!");
      })
      .catch((error) => {
        console.error("保存每日任务时出错:", error);
      });
  } catch (error) {
    console.error("保存每日任务时发生错误:", error);
  }
}

// 任务管理函数
function addNewTask() {
  const taskName = prompt('请输入新任务名称:');
  if (!taskName || taskName.trim() === '') return;
  
  const taskPoints = parseInt(prompt('请输入完成任务可获得的积分:'));
  if (isNaN(taskPoints) || taskPoints <= 0) {
    alert('积分必须是大于0的数字');
    return;
  }
  
  const newTask = {
    id: Date.now(),
    name: taskName.trim(),
    points: taskPoints,
    completed: false,
    createdAt: Date.now()
  };
  
  dailyTasks.push(newTask);
  saveDailyTasks();
  renderDailyTasks();
  
  // 添加这行：确保面板高度更新
  updatePanelHeight('dailyTaskPanel');
}

// 添加这个新函数
function updatePanelHeight(panelId) {
  const panel = document.getElementById(panelId);
  if (panel && panel.style.maxHeight) {
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
}

function editTask(index) {
  const task = dailyTasks[index];
  
  const taskName = prompt('请输入任务名称:', task.name);
  if (!taskName || taskName.trim() === '') return;
  
  const taskPoints = parseInt(prompt('请输入完成任务可获得的积分:', task.points));
  if (isNaN(taskPoints) || taskPoints <= 0) {
    alert('积分必须是大于0的数字');
    return;
  }
  
  dailyTasks[index] = {
    ...task,
    name: taskName.trim(),
    points: taskPoints
  };
  
  saveDailyTasks();
  renderDailyTasks();
  
  // 添加这行：确保面板高度更新
  updatePanelHeight('dailyTaskPanel');
}

// 时间和日期相关函数
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
    const speechBubble = document.getElementById('puppy-speech-bubble');
    if (speechBubble) {
      speechBubble.textContent = `今天是我们在一起的第 ${accompanyDays} 天啦！`;
      speechBubble.style.opacity = "1";
      
      setTimeout(() => {
        speechBubble.style.opacity = "0";
      }, 5000);
    }
  }
}

// ==================== UI更新函数 ====================

function updateDisplay() {
  document.getElementById('totalScore').textContent = `当前积分：${score}`;
  document.getElementById('log').innerHTML = log
    .slice(-10).reverse().map(entry => 
      `<div class="log-entry">
        <div class="log-time">${new Date(entry.time).toLocaleDateString()} ${new Date(entry.time).toLocaleTimeString()}</div>
        <div class="log-content">
          <span class="log-action">${entry.action}</span>
          <span class="badge ${entry.action.includes('兑换') ? 'badge-store' : entry.points > 0 ? 'badge-add' : 'badge-deduct'}">${entry.points > 0 ? '+' : ''}${entry.points}</span>
        </div>
      </div>`
    ).join('');
}

function updateDaysDisplay() {
  const daysElement = document.getElementById('accompanyDays');
  if (daysElement) {
    // 使用全局定义的固定起始日期
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

function renderDailyTasks() {
  const tasksContainer = document.getElementById('dailyTasks');
  if (!tasksContainer) return;
  
  tasksContainer.innerHTML = '';
  
  if (dailyTasks.length === 0) {
    tasksContainer.innerHTML = '<div style="text-align:center; padding: 10px; color: #999;">暂无任务，请添加</div>';
    return;
  }
  
  dailyTasks.forEach((task, index) => {
    const taskItem = document.createElement('div');
    taskItem.className = `task-item ${task.completed ? 'task-completed' : ''}`;
    
    taskItem.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-name">${task.name}</div>
        <div class="task-points">完成可得 +${task.points} 分</div>
      </div>
      <div class="task-controls">
        <button class="task-edit-btn"><i class="fas fa-edit"></i></button>
        <button class="task-delete-btn"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    // 添加复选框事件
    const checkbox = taskItem.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked && !task.completed) {
        // 完成任务，加分
        task.completed = true;
        score += task.points;
        log.push({
          time: Date.now(),
          action: `完成任务: ${task.name}`,
          points: task.points
        });
        saveScore();
        showSpecialMessage(task.points);
        updatePuppyState(task.points);
      } else if (!checkbox.checked && task.completed) {
        // 取消完成，扣分
        task.completed = false;
        score -= task.points;
        log.push({
          time: Date.now(),
          action: `取消完成任务: ${task.name}`,
          points: -task.points
        });
        saveScore();
        showSpecialMessage(-task.points);
        updatePuppyState(-task.points);
      }
      
      // 更新任务状态
      dailyTasks[index].completed = task.completed;
      saveDailyTasks(); // 确保任务状态变更后保存到Firebase
      taskItem.classList.toggle('task-completed', task.completed);
      updateDisplay();
    });
    
    // 添加编辑按钮事件
    const editBtn = taskItem.querySelector('.task-edit-btn');
    editBtn.addEventListener('click', () => {
      editTask(index);
    });
    
    // 添加删除按钮事件
    const deleteBtn = taskItem.querySelector('.task-delete-btn');
    deleteBtn.addEventListener('click', () => {
      if (confirm(`确定要删除任务"${task.name}"吗？`)) {
        dailyTasks.splice(index, 1);
        saveDailyTasks();
        renderDailyTasks();
      }
    });
    
    tasksContainer.appendChild(taskItem);
  });
  
  // 添加这段代码：更新面板高度
  const dailyTaskPanel = document.getElementById('dailyTaskPanel');
  if (dailyTaskPanel && dailyTaskPanel.style.maxHeight) {
    dailyTaskPanel.style.maxHeight = dailyTaskPanel.scrollHeight + "px";
  }
}

// 小狗相关函数
function showSpecialMessage(points) {
  if (!speechBubble) return;
  
  if (points > 0) {
    const messages = [
      "加分了！！主人你好好~",
      "主人最好了~加分！",
      "好开心，又加分啦！",
      "谢谢主人奖励我~",
      "汪汪~主人对我真好！",
      "我会更乖的！",
      "主人是世界上最好的！",
      "开心得摇尾巴~"
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

function showMessage(message, duration = 3000) {
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  messageElement.textContent = message;
  document.body.appendChild(messageElement);
  
  setTimeout(() => {
    messageElement.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    messageElement.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 300);
  }, duration);
}

function initPuppy() {
  const puppy = document.getElementById('cute-puppy');
  speechBubble = document.getElementById('puppy-speech-bubble');
  const puppyImage = document.getElementById('puppy-image');
  
  // 添加CSS变量来控制动画速度
  document.documentElement.style.setProperty('--puppy-gif-speed', '1s');
  document.documentElement.style.setProperty('--puppy-move-range', '50px');
  document.documentElement.style.setProperty('--puppy-move-interval', '5000ms');
  
  // 初始化小狗状态和行为
  if (puppy && puppyImage) {
    // 确保小狗图片正确加载
    puppyImage.onerror = function() {
      console.error("小狗图片加载失败！");
      // 显示错误信息
      puppy.innerHTML = '<div style="color:red">小狗图片加载失败</div>';
    };
    
    // 设置默认图片
    puppyImage.src = './images/normal_puppy.gif';
    
    // 添加点击事件
    puppy.addEventListener('click', () => {
      const randomPhrases = [
        "汪~",
        "主人，小狗爱您！",
        "摸摸我嘛~",
        "今天表现好，可以加分吗？",
        "我会乖乖的~",
        "主人最好了~",
        "抱抱我嘛~",
        "我想要亲亲~",
        "我会一直陪着主人~"
      ];
      
      if (speechBubble) {
        speechBubble.textContent = randomPhrases[Math.floor(Math.random() * randomPhrases.length)];
        speechBubble.style.opacity = "1";
        
        setTimeout(() => {
          speechBubble.style.opacity = "0";
        }, 3000);
      }
    });
    
    // 确保小狗元素可见
    puppy.style.display = 'block';
    console.log("小狗初始化完成");
  } else {
    console.error("找不到小狗元素或图片元素！");
  }
}

// 更新小狗状态
function updatePuppyState(points) {
  const puppy = document.getElementById('cute-puppy');
  const puppyImage = document.getElementById('puppy-image');
  
  if (!puppy || !puppyImage) return;
  
  // 清除之前的定时器（如果存在）
  if (window.puppyStateTimer) {
    clearTimeout(window.puppyStateTimer);
  }
  
  // 根据积分变化调整小狗的状态
  if (points > 0) {
    // 加分，小狗开心
    puppyImage.src = './images/happy_puppy.gif';
    puppy.classList.add('happy');
    puppy.classList.remove('sad');
    
    // 10分钟后恢复正常
    window.puppyStateTimer = setTimeout(() => {
      puppyImage.src = './images/normal_puppy.gif';
      puppy.classList.remove('happy');
    }, 600000); // 10分钟 = 600000毫秒
  } else if (points < 0) {
    // 扣分，小狗难过
    puppyImage.src = './images/sad_puppy.gif';
    puppy.classList.add('sad');
    puppy.classList.remove('happy');
    
    // 10分钟后恢复正常
    window.puppyStateTimer = setTimeout(() => {
      puppyImage.src = './images/normal_puppy.gif';
      puppy.classList.remove('sad');
    }, 600000); // 10分钟 = 600000毫秒
  }
}

// ==================== 事件处理函数 ====================

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
    // 处理自定义记录功能
    if (item.isCustomRecord) {
      const customText = prompt("请输入要记录的内容：");
      if (customText && customText.trim() !== "") {
        const points = 0; // 自定义记录不增减积分
        log.push({time: Date.now(), action: `记录: ${customText}`, points});
        saveScore();
        updateDisplay();
        showMessage("记录已保存！", 3000);
      }
      return;
    }
    
    let points = 0;
    if(type === 'store') {
      if(score >= item.cost) {
        points = -item.cost;
        score += points;
        log.push({time: Date.now(), action: `兑换 ${item.name}`, points});
        saveScore();
        showSpecialMessage(points);
        updatePuppyState(points);
      }
    } else {
      points = type === 'add' ? item.points : -item.points;
      score += points;
      log.push({time: Date.now(), action: item.name, points});
      saveScore();
      showSpecialMessage(points);
      updatePuppyState(points);
    }
    updateDisplay();
  };
  return btn;
}

// 面板切换函数
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel.style.maxHeight) {
    panel.style.maxHeight = null;
  } else {
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
}

// 将togglePanel函数添加到window对象
window.togglePanel = togglePanel;

// ==================== 配置数据 ====================

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
    {name: "记录下今天吧~", cost: 0, desc: "记录咯", isCustomRecord: true},
    {name: "抱抱", cost: 0},
    {name: "亲亲", cost: 0},
    {name: "摸摸它", cost: 10},
    {name: "主人照片", cost: 30},
    {name: "文字涩涩", cost: 40, desc: "次数：数不清了"},
    {name: "语音涩涩", cost: 60, desc: "次数：3/10"},
    {name: "神秘礼物", cost: 300, desc: "每次兑换加100"}
  ]
};

// ==================== 初始化函数 ====================

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

  // 添加登录按钮事件监听
  const loginBtn = document.getElementById('loginBtn');
  const passwordInput = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');
  const loginScreen = document.getElementById('loginScreen');
  
  if (loginBtn && passwordInput && loginScreen) {
    loginBtn.addEventListener('click', function() {
      const password = passwordInput.value;
      
      if (password === ADMIN_PASSWORD) {
        // 主人登录
        localStorage.setItem('userRole', 'admin');
        loginScreen.style.display = 'none';
      } else if (password === PUPPY_PASSWORD) {
        // 小狗登录
        localStorage.setItem('userRole', 'puppy');
        loginScreen.style.display = 'none';
      } else {
        // 密码错误
        loginError.textContent = '密码错误，请重试';
        passwordInput.value = '';
      }
    });
    
    // 添加回车键登录功能
    passwordInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        loginBtn.click();
      }
    });
  }
  
  // 添加退出登录按钮
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'logoutBtn';
  logoutBtn.className = 'btn';
  logoutBtn.textContent = '退出登录';
  logoutBtn.style.position = 'fixed';
  logoutBtn.style.top = '10px';
  logoutBtn.style.right = '10px';
  logoutBtn.style.zIndex = '999';
  logoutBtn.style.background = '#ff7eb9';
  logoutBtn.style.color = 'white';
  logoutBtn.style.padding = '5px 10px';
  logoutBtn.style.borderRadius = '5px';
  logoutBtn.style.border = 'none';
  logoutBtn.style.cursor = 'pointer';
  logoutBtn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  logoutBtn.addEventListener('click', function() {
    if(confirm('确定要退出登录吗？')) {
      localStorage.removeItem('userRole');
      location.reload(); // 刷新页面，回到登录界面
    }
  });
  
  document.body.appendChild(logoutBtn);

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
  
  // 初始化实时时钟
  updateClock();
  setInterval(updateClock, 1000);

  // 初始化每日任务功能
  const addTaskBtn = document.getElementById('addTaskBtn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', addNewTask);
    console.log('成功为添加任务按钮添加事件监听器');
  } else {
    console.error('未找到ID为addTaskBtn的元素，请检查HTML');
  }
  
  // 显示管理控制按钮（如果是主人登录）
  const taskAdminControls = document.getElementById('taskAdminControls');
  if (taskAdminControls) {
    // 检查是否是主人登录
    const isAdmin = localStorage.getItem('userRole') === 'admin';
    taskAdminControls.style.display = isAdmin ? 'block' : 'none';
  }

  // 初始展开每日清单面板
  const dailyTaskPanel = document.getElementById('dailyTaskPanel');
  if (dailyTaskPanel) {
    dailyTaskPanel.style.maxHeight = dailyTaskPanel.scrollHeight + "px";
  }
};
