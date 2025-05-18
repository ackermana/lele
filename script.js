// 导入Firebase相关模块
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
// 导入配置文件
import { firebaseConfig, ADMIN_PASSWORD, PUPPY_PASSWORD } from './config.js';

// ==================== 全局变量 ====================
let score = 0; // 当前积分
let log = []; // 操作日志
let accompanyDays = 1; // 初始天数设置为51天
let speechBubble = null; // 用于存储对话气泡元素的引用
let startDate = new Date('2025-03-14T12:00:00'); // 设置为2025年3月14日中午12点
// 在全局变量部分添加
let dailyTasks = []; // 添加每日任务数组
let wishes = []; // 添加小狗愿望数组
// 添加小狗点击奖励相关变量
let dailyClickReward = 0; // 今日已获得的点击奖励
const MAX_DAILY_CLICK_REWARD = 20; // 每日点击奖励上限
let lastClickRewardDate = ''; // 上次获得点击奖励的日期
// 添加登录身份变量
let loginIdentity = ''; // 记录登录身份：'puppy' 或 'master'
// 添加聊天消息相关变量
let chatMessages = []; // 存储聊天消息

// 新增：签到相关全局变量
let lastCheckInDate = null; // YYYY-MM-DD格式
let consecutiveCheckInDays = 0;


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
// 统一的数据保存函数
function saveData(path, data, successCallback = null) {
  console.log(`正在保存数据到 Firebase: ${path}...`);
  
  try {
    set(ref(database, path), data)
      .then(() => {
        console.log(`数据保存成功: ${path}`);
        if (successCallback) successCallback();
        
        // 如果是保存全部数据，更新本地缓存
        if (path === 'lele') {
          try {
            const cacheData = {
              ...data,
              timestamp: Date.now()
            };
            localStorage.setItem('puppyAppData', JSON.stringify(cacheData));
          } catch (error) {
            console.error("缓存数据到本地存储失败:", error);
          }
        }
      })
      .catch((error) => {
        console.error(`保存数据时出错: ${path}`, error);
        showMessage(`保存失败: ${error.message}`, 3000);
      });
  } catch (error) {
    console.error(`保存数据时发生错误: ${path}`, error);
    showMessage(`保存失败: ${error.message}`, 3000);
  }
}

// 替换原有的保存函数
function saveDays() {
  saveData('lele/accompanyDays', accompanyDays);
}

// 添加一个新函数，一次性获取所有数据
function loadAllData() {
  console.log("正在一次性加载所有数据...");
  
  // 显示加载指示器
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-overlay';
  loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
  document.body.appendChild(loadingIndicator);
  
  // 先尝试从本地缓存加载
  try {
    const cachedData = localStorage.getItem('puppyAppData');
    if (cachedData) {
      const data = JSON.parse(cachedData);
      const cacheTime = data.timestamp || 0;
      const now = Date.now();
      
      // 如果缓存不超过5分钟，直接使用缓存数据
      if (now - cacheTime < 5 * 60 * 1000) {
        console.log("使用本地缓存数据");
        score = data.score || 0;
        log = data.log || [];
        accompanyDays = data.accompanyDays || 51;
        dailyTasks = data.dailyTasks || [];
        wishes = data.wishes || [];
        // 添加这一行：从缓存中恢复登录身份
        loginIdentity = data.loginIdentity || '';
        // 从缓存加载留言数据
        chatMessages = data.chatMessages || [];
        // 新增：从缓存加载签到数据
        lastCheckInDate = data.lastCheckInDate || null;
        consecutiveCheckInDays = data.consecutiveCheckInDays || 0;

        // 更新界面
        updateDisplay();
        updateDaysDisplay();
        renderDailyTasks();
        renderWishes();
        renderMessageBoard();
        initCheckIn(); // 新增：初始化签到状态

        // 隐藏加载指示器
        document.body.removeChild(loadingIndicator);
        
        // 在后台仍然加载最新数据
        loadFromFirebase(false);
        return;
      }
    }
  } catch (error) {
    console.error("读取本地缓存失败:", error);
  }
  
  // 如果没有可用缓存，从Firebase加载
  loadFromFirebase(true);
  
  function loadFromFirebase(showLoading) {
    // 获取根引用
    const rootRef = ref(database, 'lele');
    
    onValue(rootRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // 更新所有数据
      score = data.score || 0;
      log = data.log || [];
      accompanyDays = data.accompanyDays || 51;
      dailyTasks = data.dailyTasks || [];
      wishes = data.wishes || [];
      chatMessages = data.chatMessages || [];
      // 新增：加载签到数据
      lastCheckInDate = data.lastCheckInDate || null;
      consecutiveCheckInDays = data.consecutiveCheckInDays || 0;

      loginIdentity = data.loginIdentity || '';
      
      // 处理每日点击奖励
      const clickRewardData = data.dailyClickReward;
      if (clickRewardData) {
        const today = new Date().toDateString();
        if (clickRewardData.date === today) {
          dailyClickReward = clickRewardData.amount || 0;
          lastClickRewardDate = clickRewardData.date;
        } else {
          dailyClickReward = 0;
          lastClickRewardDate = today;
          saveDailyClickReward();
        }
      } else {
        dailyClickReward = 0;
        lastClickRewardDate = new Date().toDateString();
        saveDailyClickReward();
      }
      
      // 更新界面
      updateDisplay();
      updateDaysDisplay();
      renderDailyTasks();
      renderWishes();
      initCheckIn(); // 新增：初始化签到状态
      
      // 添加错误处理，防止聊天功能影响其他功能
      try {
        renderMessageBoard(); 
      } catch (error) {
        console.error("渲染留言板消息时出错:", error);
      }
      
      // 缓存数据到本地存储
      try {
        const cacheData = {
          score,
          log,
          accompanyDays,
          dailyTasks,
          wishes,
          chatMessages,
          loginIdentity,
          // 新增：缓存签到数据
          lastCheckInDate,
          consecutiveCheckInDays,
          timestamp: Date.now()
        };
        localStorage.setItem('puppyAppData', JSON.stringify(cacheData));
      } catch (error) {
        console.error("缓存数据到本地存储失败:", error);
      }
      
      // 隐藏加载指示器
      if (showLoading && document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator);
      }
      
    }, (error) => {
      console.error("从Firebase加载数据失败:", error);
      
      // 隐藏加载指示器
      if (showLoading && document.body.contains(loadingIndicator)) {
        document.body.removeChild(loadingIndicator);
      }
      
      // 显示错误信息
      document.getElementById('totalScore').textContent = `当前积分：${score} (加载失败)`;
      document.getElementById('log').innerHTML = '<div style="color:red">数据加载失败，请刷新页面重试</div>';
    });
  }
}

// 保留原来的loadScore函数以兼容旧代码
function loadScore() {
  console.log("使用新的数据加载方法...");
  loadAllData();
}

function saveScore() {
  // 创建包含所有数据的对象
  const allData = {
    score,
    log,
    accompanyDays,
    dailyTasks,
    wishes,
    chatMessages: chatMessages,
    loginIdentity,
    // 新增：保存签到数据
    lastCheckInDate,
    consecutiveCheckInDays,
    dailyClickReward: {
      date: lastClickRewardDate,
      amount: dailyClickReward
    }
  };
  
  // 立即更新显示，不等待Firebase保存完成
  updateDisplay();
  
  saveData('lele', allData);
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
      // 计算从固定起始日期到现在的天数
      const diffTime = Math.abs(now - startDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      speechBubble.textContent = `今天是我们在一起的第 ${diffDays} 天啦！`;
      speechBubble.style.opacity = "1";
      
      setTimeout(() => {
        speechBubble.style.opacity = "0";
      }, 5000);
    }
    
    // 添加这一行：在新的一天重置每日任务
    resetDailyTasks();
  }
}

// 添加重置每日任务的函数
function resetDailyTasks() {
  const now = new Date();
  const lastResetKey = 'lastTasksReset';
  const lastReset = localStorage.getItem(lastResetKey);
  const today = now.toDateString();
  
  // 如果是新的一天（过了午夜）且还没有重置过
  if (lastReset !== today && now.getHours() >= 0) {
    console.log("重置每日任务状态...");
    
    // 将所有任务标记为未完成
    let tasksChanged = false;
    dailyTasks.forEach(task => {
      if (task.completed) {
        task.completed = false;
        tasksChanged = true;
      }
    });
    
    // 如果有任务状态被改变，保存到数据库
    if (tasksChanged) {
      saveDailyTasks();
      renderDailyTasks();
      showMessage("每日任务已重置", 3000);
    }
    
    // 记录最后重置时间
    localStorage.setItem(lastResetKey, today);
  }
}

// ==================== UI更新函数 ====================

function updateDisplay() {
  document.getElementById('totalScore').textContent = `当前积分：${score}`;
  document.getElementById('log').innerHTML = log
    .slice(-100).reverse().map(entry => 
      `<div class="log-entry">
        <div class="log-time">${new Date(entry.time).toLocaleDateString()} ${new Date(entry.time).toLocaleTimeString()}</div>
        <div class="log-content">
          <span class="log-action">${entry.action}</span>
          <span class="badge ${getBadgeClass(entry)}">${entry.points > 0 ? '+' : ''}${entry.points}</span>
        </div>
      </div>`
    ).join('');
    
  // 辅助函数，根据日志条目确定徽章类型
  function getBadgeClass(entry) {
    if (entry.action.includes('兑换') || entry.action.includes('商店')) {
      return 'badge-store';
    } else if (entry.points > 0) {
      return 'badge-add';
    } else {
      return 'badge-deduct';
    }
  }
}

// 新增：获取YYYY-MM-DD格式的日期字符串
function getFormattedDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 新增：签到相关函数
function initCheckIn() {
  const today = new Date();
  const todayFormatted = getFormattedDate(today);
  const checkInBtn = document.getElementById('checkInBtn');
  const checkInStatusEl = document.getElementById('checkInStatus');

  if (!checkInBtn || !checkInStatusEl) {
    console.error("签到按钮或状态元素未找到");
    return;
  }

  if (lastCheckInDate) {
    const lastDate = new Date(lastCheckInDate); // 假设 lastCheckInDate 是 YYYY-MM-DD
    
    // 将日期设置为当天的开始，以避免时区问题影响天数计算
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const lastDateStart = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());

    const diffTime = todayStart.getTime() - lastDateStart.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) { // 如果不是昨天签到，即中断
      if (score >= 10) { // 确保有足够分数扣除
          score -= 10;
          log.push({
              time: Date.now(),
              action: "中断签到扣分",
              points: -10
          });
          showMessage("签到中断，扣除10分", 3000);
      } else {
          showMessage("签到中断，但分数不足以扣除", 3000);
      }
      consecutiveCheckInDays = 0;
      saveScore(); // 保存扣分和连续天数重置
    } else if (diffDays === 0 && lastCheckInDate === todayFormatted) {
      // 今天已经签到过了 (diffDays === 0 意味着 lastCheckInDate 是今天)
      // 此处逻辑在 handleCheckIn 中处理，initCheckIn 主要处理隔天逻辑
    }
  } else {
    // 首次使用或数据重置
    consecutiveCheckInDays = 0;
  }
  updateCheckInUI();
}

function handleCheckIn() {
  const todayFormatted = getFormattedDate(new Date());
  const checkInBtn = document.getElementById('checkInBtn');

  if (lastCheckInDate === todayFormatted) {
    showMessage("今天已经签到过了！", 3000);
    checkInBtn.disabled = true;
    checkInBtn.querySelector('div').textContent = '今日已签到';
    return;
  }

  let pointsEarned = 5;
  // 检查昨天是否签到，以正确增加连续签到天数
  if (lastCheckInDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (getFormattedDate(yesterday) === lastCheckInDate) {
          consecutiveCheckInDays++;
      } else {
          // 如果昨天没签到，但也不是更早（这种情况已在initCheckIn处理断签），则从1开始
          // 如果lastCheckInDate不是昨天，说明是断签后首次签到，或首次签到
          consecutiveCheckInDays = 1; 
      }
  } else {
      // 首次签到
      consecutiveCheckInDays = 1;
  }


  if (consecutiveCheckInDays >= 7) {
    pointsEarned = 15;
  } else if (consecutiveCheckInDays >= 3) {
    pointsEarned = 10;
  }

  score += pointsEarned;
  lastCheckInDate = todayFormatted;
  
  log.push({
    time: Date.now(),
    action: `每日签到 (连续${consecutiveCheckInDays}天)`,
    points: pointsEarned
  });

  saveScore();
  updateCheckInUI();
  updateDisplay(); // 更新总积分和日志显示
  showSpecialMessage(pointsEarned);
  showMessage(`签到成功！获得 ${pointsEarned} 积分，已连续签到 ${consecutiveCheckInDays} 天。`, 3000);
}

function updateCheckInUI() {
  const checkInBtn = document.getElementById('checkInBtn');
  const checkInStatusEl = document.getElementById('checkInStatus');
  const todayFormatted = getFormattedDate(new Date());

  if (!checkInBtn || !checkInStatusEl) return;

  if (lastCheckInDate === todayFormatted) {
    checkInBtn.querySelector('div').textContent = '今日已签到';
    checkInBtn.disabled = true;
    checkInBtn.classList.remove('add-btn');
    checkInBtn.classList.add('store-btn'); // 改为商店按钮样式或自定义已签到样式
  } else {
    checkInBtn.querySelector('div').textContent = '签到';
    checkInBtn.disabled = false;
    checkInBtn.classList.add('add-btn');
    checkInBtn.classList.remove('store-btn');
  }
  checkInStatusEl.textContent = `已连续签到 ${consecutiveCheckInDays} 天`;
  
  // 更新面板高度
  const checkInPanel = document.getElementById('checkInPanel');
  if (checkInPanel && checkInPanel.style.maxHeight) {
      checkInPanel.style.maxHeight = checkInPanel.scrollHeight + "px";
  }
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
        <button class="move-btn ${index === 0 ? 'disabled' : ''}" title="上移" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
        <button class="move-btn ${index === dailyTasks.length - 1 ? 'disabled' : ''}" title="下移" ${index === dailyTasks.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
        <button class="task-edit-btn" title="编辑"><i class="fas fa-edit"></i></button>
        <button class="task-delete-btn" title="删除"><i class="fas fa-trash"></i></button>
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
    
    // 添加上移按钮事件
    const moveUpBtn = taskItem.querySelectorAll('.move-btn')[0];
    moveUpBtn.addEventListener('click', () => {
      if (index > 0) {
        moveTask(index, 'up');
      }
    });
    
    // 添加下移按钮事件
    const moveDownBtn = taskItem.querySelectorAll('.move-btn')[1];
    moveDownBtn.addEventListener('click', () => {
      if (index < dailyTasks.length - 1) {
        moveTask(index, 'down');
      }
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
  // 新增：确保签到面板也更新高度
  updateCheckInUI();
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
      const today = new Date().toDateString();
      if (lastClickRewardDate !== today) {
        dailyClickReward = 0;
        lastClickRewardDate = today;
      }

      // 先判断是否触发奖励（25%概率）
      const rewardProb = 0.25;
      const rewardTriggered = Math.random() < rewardProb;

      // 奖励分数分布
      const rewardChances = [
        { points: 1, prob: 0.2 },
        { points: 2, prob: 0.3 },
        { points: 3, prob: 0.3 },
        { points: 5, prob: 0.15 },
        { points: 10, prob: 0.05 }
      ];
      
      // 如果触发奖励且未达到每日上限
      if (rewardTriggered && dailyClickReward < MAX_DAILY_CLICK_REWARD) {
        // 随机选择奖励分数
        let random = Math.random();
        let cumulativeProb = 0;
        let rewardPoints = 1; // 默认值
        
        for (const chance of rewardChances) {
          cumulativeProb += chance.prob;
          if (random <= cumulativeProb) {
            rewardPoints = chance.points;
            break;
          }
        }
        
        // 确保不超过每日上限
        if (dailyClickReward + rewardPoints > MAX_DAILY_CLICK_REWARD) {
          rewardPoints = MAX_DAILY_CLICK_REWARD - dailyClickReward;
        }
        
        if (rewardPoints > 0) {
          // 更新积分和日志
          score += rewardPoints;
          dailyClickReward += rewardPoints;
          log.push({
            time: Date.now(),
            action: `点击小狗获得奖励`,
            points: rewardPoints
          });
          
          // 显示奖励消息
          showSpecialMessage(rewardPoints);
          
          // 更新小狗状态
          updatePuppyState(rewardPoints);
          
          // 保存数据
          saveScore();
          
          // 添加这一行：保存每日点击奖励数据
          saveDailyClickReward();
        }
      } else if (rewardTriggered) {
        // 达到上限，显示多种特殊消息
        const upperLimitMessages = [
          "今天的奖励已经领完啦，明天再来吧！",
          "奖励已经发完了，明天继续努力哦~",
          "乐乐，今天不能再领奖励啦！",
          "汪~今天的奖励额度用光啦，明天见！",
          "奖励上限已达成，明天再摸我吧~",
          "小狗奖励已经满啦，明天还可以继续哦！"
        ];
        if (speechBubble) {
          speechBubble.textContent = upperLimitMessages[Math.floor(Math.random() * upperLimitMessages.length)];
          speechBubble.style.color = "#F44336";
          speechBubble.style.backgroundColor = "#FFEBEE";
          speechBubble.style.opacity = "1";
          setTimeout(() => {
            speechBubble.style.opacity = "0";
          }, 4000);
        }
        updatePuppyState(0);
      } else {
        // 随机显示普通消息
        const normalMessages = [
          "汪汪~",
          "爸爸~",
          "老公~",
          "我不是傻狗！",
          "主人...",
          "（摇屁股",
          "是主人的小狗呀~",
          "我是小贱狗~",
          "主人，我好饿~",
          "主人喝水~",
          "一起咕咚咕咚！",
          "主人，好痒~",
          "好痒啊~",
          "主人，我想睡觉~",
          "嗯呐~",
          "我好委屈~",
          "我不是哭哭！",
          "主人，我要学习！",
          "主人，我要玩~",
          "主人好~",
          "摸摸头~",
          "乐乐爱主人~",
          "今天天气真好~",
          "主人陪我玩~",
          "乐乐想吃零食~",
          "抱抱我~",
          "叫姐姐~",
          "主人，小狗爱您！",
          "摸摸小狗有奖励哦~",
          "摸摸我嘛~",
          "今天表现好，可以加分吗？",
          "我会乖乖的~",
          "主人最好了~",
          "那可不~",
          "小狗爱主人！！！",
          "我不是小猪！！！",
          "抱抱我嘛~",
          "我想要亲亲~",
          "我会一直陪着主人~"
        ];
        
        if (speechBubble) {
          speechBubble.textContent = normalMessages[Math.floor(Math.random() * normalMessages.length)];
          speechBubble.style.opacity = "1";
          speechBubble.style.color = "";
          speechBubble.style.backgroundColor = "";
          speechBubble.style.opacity = "1";
          setTimeout(() => {
            speechBubble.style.opacity = "0";
          }, 4000);
        }
        updatePuppyState(0);
      }
    });
    
    // 确保小狗元素可见
    puppy.style.display = 'block';
    console.log("小狗初始化完成");
  } else {
    console.error("找不到小狗元素或图片元素！");
  }
}

// 保存每日点击奖励数据到Firebase
function saveDailyClickReward() {
  saveData('lele/dailyClickReward', {
    date: lastClickRewardDate,
    amount: dailyClickReward
  });
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
  
  // 创建左侧文本容器
  const textSpan = document.createElement('span');
  textSpan.style.flexGrow = '1'; // 让文本占据剩余空间
  textSpan.style.textAlign = 'left'; // 文本左对齐
  
  // 设置文本内容
  if (item.name) {
    const nameDiv = document.createElement('div');
    nameDiv.textContent = item.name;
    textSpan.appendChild(nameDiv);
    
    if (item.desc) {
      const descDiv = document.createElement('small');
      descDiv.style.color = '#666';
      descDiv.textContent = item.desc;
      textSpan.appendChild(descDiv);
    }
  } else if (item.text) {
    textSpan.textContent = item.text;
  }
  
  // 创建右侧积分容器
  const pointsSpan = document.createElement('span');
  pointsSpan.style.marginLeft = 'auto'; // 确保积分值靠右
  pointsSpan.style.fontWeight = 'bold'; // 加粗积分
  
  // 设置积分文本
  if (type === 'store') {
    pointsSpan.textContent = `${item.cost}分`;
  } else {
    pointsSpan.textContent = `${item.points}分`;
  }
  
  // 添加到按钮
  btn.appendChild(textSpan);
  btn.appendChild(pointsSpan);
  
  // 检查用户角色，如果是小狗登录且不是每日任务相关按钮，则禁用按钮
  const isPuppy = localStorage.getItem('userRole') === 'puppy';
  if (isPuppy && (type === 'add' || type === 'deduct')) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    btn.title = '小狗不能修改积分哦~';
    
    // 移除点击事件
    btn.onclick = () => {
      alert('小狗不能加分哦，要找主人帮忙~');
    };
    
    return btn;
  }
  
  // 只有当不是小狗角色时，才添加正常的点击事件处理
  btn.onclick = () => {

    
    let points = 0;
    let success = true;
    let actionText = '';
    
    if(type === 'store') {
      if(score >= item.cost) {
        points = -item.cost;
        score += points;
        actionText = `兑换商店项目: ${item.name}`;
        log.push({time: Date.now(), action: actionText, points});
        saveScore();
        showSpecialMessage(points);
        updatePuppyState(points);
      } else {
        // 积分不足
        success = false;
        alert(`积分不足，无法兑换 ${item.name}！还需要 ${item.cost - score} 分`);
      }
    } else {
      points = type === 'add' ? item.points : -item.points;
      score += points;
      actionText = type === 'add' ? `加分项目: ${item.name}` : `扣分项目: ${item.name}`;
      
      // 添加到历史记录
      log.push({
        time: Date.now(),
        action: actionText,
        points: points
      });
      
      // 保存更新后的数据
      saveScore();
      updateDisplay(); // 确保立即更新显示
      showSpecialMessage(points);
      updatePuppyState(points);
    }
    
    // 只有操作成功才更新显示
    if (success) {
      updateDisplay();
      
      // 添加本地备份
      try {
        const cacheData = {
          score,
          log,
          accompanyDays,
          dailyTasks,
          wishes,
          // 移除 chatMessages 和 lastReadMessageId 的缓存
          // chatMessages,
          // lastReadMessageId,
          timestamp: Date.now()
        };
        localStorage.setItem('puppyAppData', JSON.stringify(cacheData));
      } catch (error) {
        console.error("缓存数据到本地存储失败:", error);
      }
    }
  };
  return btn;
}

// 在登录成功后初始化按钮
function initializeButtons() {
  const userRole = localStorage.getItem('userRole');
  const deductionsContainer = document.getElementById('deductions');
  const additionsContainer = document.getElementById('additions');
  const storeContainer = document.getElementById('store');
  
  // 清空现有按钮
  deductionsContainer.innerHTML = '';
  additionsContainer.innerHTML = '';
  storeContainer.innerHTML = '';
  
  // 根据用户角色初始化按钮
  if (userRole === 'admin') {
    // 管理员可以看到所有按钮并正常使用
    initializeDeductions();
    initializeAdditions();
    initializeStore();
  } else if (userRole === 'puppy') {
    // 小狗只能看到按钮但不能点击
    initializeDeductionsForPuppy();
    initializeAdditionsForPuppy();
    initializeStoreForPuppy();
  }
}

// 为小狗初始化扣分按钮（只读）
function initializeDeductionsForPuppy() {
  const container = document.getElementById('deductions');
  deductionItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'btn deduct-btn';
    btn.innerHTML = `${item.name} <span class="badge">-${item.points}</span>`;
    btn.disabled = true;
    btn.addEventListener('click', () => {
      showMessage('小狗不能自己扣分哦！', 2000);
    });
    container.appendChild(btn);
  });
}

function initializeDeductions() {
  const container = document.getElementById('deductions');
  deductionItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'btn deduct-btn';
    btn.innerHTML = `${item.name} <span class="badge">-${item.points}</span>`;
    btn.addEventListener('click', () => {
      score -= item.points;
      log.push({
        time: Date.now(),
        action: `扣分项目: ${item.name}`,
        points: -item.points
      });
      saveScore();
      updateDisplay();
      showSpecialMessage(-item.points);
      updatePuppyState(-item.points);
    });
    container.appendChild(btn);
  });
}

function initializeAdditions() {
  const container = document.getElementById('additions');
  additionItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'btn add-btn';
    btn.innerHTML = `${item.name} <span class="badge">+${item.points}</span>`;
    btn.addEventListener('click', () => {
      score += item.points;
      log.push({
        time: Date.now(),
        action: `加分项目: ${item.name}`,
        points: item.points
      });
      saveScore();
      updateDisplay();
      showSpecialMessage(item.points);
      updatePuppyState(item.points);
    });
    container.appendChild(btn);
  });
}

function initializeStore() {
  const container = document.getElementById('store');
  storeItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'btn store-btn';
    btn.innerHTML = `${item.name} <span class="badge">${item.cost}分</span>`;
    btn.addEventListener('click', () => {
      if (score >= item.cost) {
        score -= item.cost;
        log.push({
          time: Date.now(),
          action: `兑换商店项目: ${item.name}`,
          points: -item.cost
        });
        saveScore();
        updateDisplay();
        showSpecialMessage(-item.cost);
        updatePuppyState(-item.cost);
        showMessage(`成功兑换: ${item.name}`, 3000);
      } else {
        showMessage(`积分不足，无法兑换 ${item.name}！还需要 ${item.cost - score} 分`, 3000);
      }
    });
    container.appendChild(btn);
  });
}

// 为小狗初始化加分按钮（只读）
function initializeAdditionsForPuppy() {
  const container = document.getElementById('additions');
  additionItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'btn add-btn';
    btn.innerHTML = `${item.name} <span class="badge">+${item.points}</span>`;
    btn.disabled = true;
    btn.addEventListener('click', () => {
      showMessage('小狗不能自己加分哦！', 2000);
    });
    container.appendChild(btn);
  });
}

// 为小狗初始化商店按钮（只读）
function initializeStoreForPuppy() {
  const container = document.getElementById('store');
  storeItems.forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'btn store-btn';
    btn.innerHTML = `${item.name} <span class="badge">${item.cost}分</span>`;
    btn.disabled = true;
    btn.addEventListener('click', () => {
      showMessage('小狗不能自己使用商店哦！', 2000);
    });
    container.appendChild(btn);
  });
}

// 修改登录处理函数
loginBtn.addEventListener('click', function() {
  const password = passwordInput.value;
  let userRole = '';
  
  if (password === ADMIN_PASSWORD) {
    userRole = 'admin';
    loginIdentity = 'master';
  } else if (password === PUPPY_PASSWORD) {
    userRole = 'puppy';
    loginIdentity = 'puppy';
  } else {
    loginError.textContent = '密码错误！';
    return;
  }
  
  // 保存用户角色和登录身份
  localStorage.setItem('userRole', userRole);
  localStorage.setItem('loginIdentity', loginIdentity);
  
  // 隐藏登录界面
  loginScreen.style.display = 'none';
  
  // 初始化按钮
  initializeButtons();
  
  // 加载数据
  loadScore();
  
  // 保存登录身份到Firebase
  saveData('lele/loginIdentity', loginIdentity);
});

// 面板切换函数
function togglePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
      
      // 如果是留言板面板，则渲染消息
      if (panelId === 'chatPanel') { // 沿用 chatPanel ID
        setTimeout(() => {
          renderMessageBoard(); // 渲染留言板消息
        }, 300);
      }
    }
  }
}

// 将togglePanel函数添加到window对象
window.togglePanel = togglePanel;

// ==================== 配置数据 ====================

const rules = {
  deductions: [
    {name: "没有早安晚安吻", points: 20, desc: "每天"},
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
    {name: "一天表现好", points: 10, desc: "上限30"},
    {name: "及时报备", points: 10},
    {name: "发语音", points: 5, desc: "每天上限20分"},
    {name: "发照片", points: 5, desc: "每天上限30分"},
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
    {name: "主人照片", cost: 30, desc: "主人主动发的也算"},
    {name: '零食大礼包', cost: 30, desc: "主人给你买"},
    {name: "文字涩涩", cost: 50, desc: "数不清了"},
    {name: "语音涩涩", cost: 80, desc: "每周不能超过两次！"},
    {name: "神秘礼物", cost: 300, desc: "每次兑换加100"}
  ]
};

// ==================== 事件监听器 ====================

document.addEventListener('DOMContentLoaded', () => {
  // 先加载所有数据
  loadAllData();
  
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

  // 最后初始化留言板界面
  initMessageBoard();

  
  // 在页面加载时检查登录状态
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  // 尝试从本地存储获取登录身份
  const savedIdentity = localStorage.getItem('loginIdentity');
  if (savedIdentity) {
    loginIdentity = savedIdentity;
    // 添加这一行：将登录身份保存到localStorage
    localStorage.setItem('loginIdentity', loginIdentity);
  }
  
  if (isLoggedIn === 'true') {
    document.getElementById('loginScreen').style.display = 'none';
  }

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
        localStorage.setItem('isLoggedIn', 'true');
        loginIdentity = 'master';
        // 添加这一行：将登录身份保存到localStorage
        localStorage.setItem('loginIdentity', loginIdentity);
        loginScreen.style.display = 'none';
        // 显示欢迎消息
        if (speechBubble) {
          speechBubble.textContent = "主人~欢迎回家！";
          speechBubble.style.opacity = "1";
          speechBubble.style.color = "#4CAF50"; // 绿色表示欢迎
          speechBubble.style.backgroundColor = "#E8F5E9"; // 浅绿色背景
          
          setTimeout(() => {
            speechBubble.style.opacity = "0";
            speechBubble.style.color = ""; 
            speechBubble.style.backgroundColor = "";
          }, 5000);
        }
        // 保存数据到Firebase
        saveScore();
      } else if (password === PUPPY_PASSWORD) {
        // 小狗登录
        localStorage.setItem('userRole', 'puppy');
        localStorage.setItem('isLoggedIn', 'true');
        loginIdentity = 'puppy';
        // 添加这一行：将登录身份保存到localStorage
        localStorage.setItem('loginIdentity', loginIdentity);
        loginScreen.style.display = 'none';
        // 显示欢迎消息
        if (speechBubble) {
          speechBubble.textContent = "乐乐~欢迎回家！";
          speechBubble.style.opacity = "1";
          speechBubble.style.color = "#4CAF50"; // 绿色表示欢迎
          speechBubble.style.backgroundColor = "#E8F5E9"; // 浅绿色背景
          
          setTimeout(() => {
            speechBubble.style.opacity = "0";
            speechBubble.style.color = ""; 
            speechBubble.style.backgroundColor = "";
          }, 5000);
        }
        // 保存数据到Firebase
        saveScore();
      } else {
        // 密码错误
        loginError.textContent = '密码错误，请重试';
        passwordInput.value = '';
        setTimeout(() => {
          loginError.textContent = '';
        }, 3000);
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
      localStorage.removeItem('isLoggedIn');
      // 添加这一行：清除登录身份
      localStorage.removeItem('loginIdentity');
      loginIdentity = '';
      location.reload(); // 刷新页面，回到登录界面
    }
  });
  
  document.body.appendChild(logoutBtn);

  // 加载Firebase数据 - 已经在开头调用过一次
  
  // 初始化天数显示
  updateDaysDisplay();
  
  // 检查并更新天数
  checkAndUpdateDays();
  resetDailyTasks(); // 立即检查一次
  
  // 设置定时器，每分钟检查一次
  setInterval(() => {
    updateClock();
    checkAndUpdateDays();
    resetDailyTasks(); // 检查并重置每日任务
  }, 60000); // 每分钟检查一次

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
  
  // 添加这段代码：为添加愿望按钮添加事件监听器
  const addWishBtn = document.getElementById('addWishBtn');
  if (addWishBtn) {
    addWishBtn.addEventListener('click', addNewWish);
    console.log('成功为添加愿望按钮添加事件监听器');
  } else {
    console.error('未找到ID为addWishBtn的元素，请检查HTML');
  }

  // 新增：签到按钮事件监听
  const checkInBtn = document.getElementById('checkInBtn');
  if (checkInBtn) {
    checkInBtn.addEventListener('click', handleCheckIn);
  }
  
  // 显示管理控制按钮（对所有用户都显示）
  const taskAdminControls = document.getElementById('taskAdminControls');
  if (taskAdminControls) {
    // 无论什么角色都显示
    taskAdminControls.style.display = 'block';
  }
  
  // 根据用户角色添加提示信息
  const isPuppy = localStorage.getItem('userRole') === 'puppy';
  if (isPuppy) {
    // 为加减分面板添加提示信息
    const addPanel = document.getElementById('addPanel');
    const deductPanel = document.getElementById('deductPanel');
    
    if (addPanel) {
      const notice = document.createElement('div');
      notice.className = 'note';
      notice.style.color = '#ff7eb9';
      notice.style.fontWeight = 'bold';
      notice.style.marginBottom = '10px';
      notice.textContent = '小狗不能自己加分哦，请找主人帮忙~';
      addPanel.insertBefore(notice, addPanel.firstChild);
    }
    
    if (deductPanel) {
      const notice = document.createElement('div');
      notice.className = 'note';
      notice.style.color = '#ff7eb9';
      notice.style.fontWeight = 'bold';
      notice.style.marginBottom = '10px';
      notice.textContent = '小狗不能自己扣分哦~';
      deductPanel.insertBefore(notice, deductPanel.firstChild);
    }
  }

  // 初始展开每日清单面板
  // const dailyTaskPanel = document.getElementById('dailyTaskPanel');
  // if (dailyTaskPanel) {
  //   dailyTaskPanel.style.maxHeight = dailyTaskPanel.scrollHeight + "px";
  // }
});

// 保存小狗愿望到Firebase
function saveWishes() {
  saveData('lele/wishes', wishes);
}

// 保存每日任务到Firebase
function saveDailyTasks() {
  saveData('lele/dailyTasks', dailyTasks);
}

// 添加新愿望
function addNewWish() {
  const wishName = prompt('请输入愿望名称:');
  if (!wishName || wishName.trim() === '') return;
  const wishDesc = prompt('请输入愿望描述(可选):') || '';
  const newWish = {
    id: Date.now(),
    name: wishName.trim(),
    description: wishDesc.trim(),
    completed: false,
    createdAt: Date.now()
  };
  wishes.push(newWish);
  saveWishes();
  renderWishes();
  updatePanelHeight('wishPanel');
}

// 编辑愿望
function editWish(index) {
  const wish = wishes[index];
  const wishName = prompt('请输入愿望名称:', wish.name);
  if (!wishName || wishName.trim() === '') return;
  const wishDesc = prompt('请输入愿望描述(可选):', wish.description || '');
  wishes[index] = {
    ...wish,
    name: wishName.trim(),
    description: wishDesc.trim()
  };
  saveWishes();
  renderWishes();
  updatePanelHeight('wishPanel');
}

// 删除愿望
function deleteWish(index) {
  if (!confirm('确定要删除这个愿望吗？')) return;
  wishes.splice(index, 1);
  saveWishes();
  renderWishes();
  updatePanelHeight('wishPanel');
}

// 添加移动任务的函数
function moveTask(index, direction) {
  if (direction === 'up' && index > 0) {
    // 向上移动
    [dailyTasks[index], dailyTasks[index-1]] = [dailyTasks[index-1], dailyTasks[index]];
    saveDailyTasks();
    renderDailyTasks();
  } else if (direction === 'down' && index < dailyTasks.length - 1) {
    // 向下移动
    [dailyTasks[index], dailyTasks[index+1]] = [dailyTasks[index+1], dailyTasks[index]];
    saveDailyTasks();
    renderDailyTasks();
  }
  updatePanelHeight('dailyTaskPanel');
}

// 添加移动愿望的函数
function moveWish(index, direction) {
  if (direction === 'up' && index > 0) {
    // 向上移动
    [wishes[index], wishes[index-1]] = [wishes[index-1], wishes[index]];
    saveWishes();
    renderWishes();
  } else if (direction === 'down' && index < wishes.length - 1) {
    // 向下移动
    [wishes[index], wishes[index+1]] = [wishes[index+1], wishes[index]];
    saveWishes();
    renderWishes();
  }
  updatePanelHeight('wishPanel');
}

// 勾选完成愿望
function toggleWishCompleted(index) {
  wishes[index].completed = !wishes[index].completed;
  saveWishes();
  renderWishes();
  updatePanelHeight('wishPanel');
}

// 渲染愿望列表
function renderWishes() {
  const wishesContainer = document.getElementById('wishItems');
  if (!wishesContainer) return;
  wishesContainer.innerHTML = '';
  if (wishes.length === 0) {
    wishesContainer.innerHTML = '<div style="text-align:center; padding: 10px; color: #999;">暂无愿望，请添加</div>';
    return;
  }
  wishes.forEach((wish, index) => {
    const wishItem = document.createElement('div');
    wishItem.className = `wish-item ${wish.completed ? 'wish-completed' : ''}`;
    wishItem.innerHTML = `
      <input type="checkbox" class="wish-checkbox" ${wish.completed ? 'checked' : ''}>
      <div class="wish-content">
        <div class="wish-name">${wish.name}</div>
        <div class="wish-description">${wish.description || ''}</div>
      </div>
      <div class="wish-controls">
        <button class="move-btn ${index === 0 ? 'disabled' : ''}" title="上移" ${index === 0 ? 'disabled' : ''}><i class="fas fa-arrow-up"></i></button>
        <button class="move-btn ${index === wishes.length - 1 ? 'disabled' : ''}" title="下移" ${index === wishes.length - 1 ? 'disabled' : ''}><i class="fas fa-arrow-down"></i></button>
        <button class="wish-edit-btn" title="编辑"><i class="fas fa-edit"></i></button>
        <button class="wish-delete-btn" title="删除"><i class="fas fa-trash"></i></button>
      </div>
    `;
    // 勾选
    wishItem.querySelector('.wish-checkbox').onclick = () => toggleWishCompleted(index);
    
    // 添加上移按钮事件
    const moveUpBtn = wishItem.querySelectorAll('.move-btn')[0];
    moveUpBtn.addEventListener('click', () => {
      if (index > 0) {
        moveWish(index, 'up');
      }
    });
    
    // 添加下移按钮事件
    const moveDownBtn = wishItem.querySelectorAll('.move-btn')[1];
    moveDownBtn.addEventListener('click', () => {
      if (index < wishes.length - 1) {
        moveWish(index, 'down');
      }
    });
    
    // 编辑
    wishItem.querySelector('.wish-edit-btn').onclick = () => editWish(index);
    // 删除
    wishItem.querySelector('.wish-delete-btn').onclick = () => deleteWish(index);
    wishesContainer.appendChild(wishItem);
  });
}

// 留言板功能相关函数
// 新增：保存留言板消息函数
function saveMessages() {
  saveData('lele/chatMessages', chatMessages); // 沿用 chatMessages 变量名，但数据结构可能需要调整
}

// 新增：添加留言函数
function addMessage(sender, messageText) {
  const newMessage = {
    id: Date.now().toString(), // 使用时间戳作为唯一ID
    sender: sender,
    text: messageText,
    timestamp: Date.now()
  };
  chatMessages.push(newMessage);
  saveMessages(); // 保存到Firebase (使用新的保存函数)
  renderMessageBoard(); // 立即更新显示
}

// 新增：渲染留言板消息函数
function renderMessageBoard() {
  const messagesContainer = document.getElementById('chatMessages'); // 沿用 chatMessages ID
  if (!messagesContainer) return;

  messagesContainer.innerHTML = ''; // 清空现有消息

  // 倒序显示最新留言在最上面
  const reversedMessages = [...chatMessages].reverse();

  if (reversedMessages.length === 0) {
    messagesContainer.innerHTML = '<div style="text-align:center; padding: 10px; color: #999;">暂无留言</div>';
    return;
  }

  reversedMessages.forEach(message => {
    const messageElement = document.createElement('div');
    messageElement.className = 'message-item'; // 使用新的类名
    messageElement.style.borderBottom = '1px solid #eee';
    messageElement.style.padding = '10px 0';
    messageElement.style.marginBottom = '10px';

    // 根据发送者添加不同的类
    if (message.sender === 'master') {
      messageElement.classList.add('message-master');
    } else if (message.sender === 'puppy') {
      messageElement.classList.add('message-puppy');
    }

    const senderElement = document.createElement('div');
    senderElement.style.fontWeight = 'bold';
    senderElement.textContent = message.sender === 'master' ? '主人' : '乐乐';

    const textElement = document.createElement('div');
    textElement.textContent = message.text;
    textElement.style.marginTop = '5px';

    const timeElement = document.createElement('div');
    timeElement.style.fontSize = '0.8em';
    timeElement.style.color = '#666';
    timeElement.style.textAlign = 'right';
    timeElement.textContent = new Date(message.timestamp).toLocaleString(); // 显示完整时间

    messageElement.appendChild(senderElement);
    messageElement.appendChild(textElement);
    messageElement.appendChild(timeElement);

    messagesContainer.appendChild(messageElement);
  });
}

// 新增：初始化留言板函数
function initMessageBoard() {
  // 检查元素是否存在
  const messagePanel = document.getElementById('chatPanel'); // 沿用 chatPanel ID
  const messageInput = document.getElementById('chatInput'); // 沿用 chatInput ID
  const sendButton = document.getElementById('sendChatButton'); // 沿用 sendChatButton ID
  const messagesContainer = document.getElementById('chatMessages'); // 沿用 chatMessages ID

  // 如果元素不存在，则提前返回
  if (!messagePanel || !messageInput || !sendButton || !messagesContainer) {
    console.warn('留言板元素未找到，跳过初始化');
    return;
  }

  // 发送按钮点击事件
  sendButton.addEventListener('click', () => {
    if (messageInput.value.trim() !== '') {
      addMessage(loginIdentity, messageInput.value); // 调用新的添加留言函数
      messageInput.value = '';
    }
  });

  // 输入框回车事件
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendButton.click();
    }
  });

  // 初始渲染留言
  renderMessageBoard();
}

// 确保登录后设置正确的身份
function login(identity, password) {
  // 验证密码
  if (identity === 'master' && password === ADMIN_PASSWORD) {
    loginIdentity = 'master';
    showMessage('主人登录成功！', 3000);
    // 更新UI显示登录状态
    // updateLoginStatus(); // Assuming updateLoginStatus is not needed or handled elsewhere
    return true;
  } else if (identity === 'puppy' && password === PUPPY_PASSWORD) {
    loginIdentity = 'puppy';
    showMessage('小狗登录成功！', 3000);
    // 更新UI显示登录状态
    // updateLoginStatus(); // Assuming updateLoginStatus is not needed or handled elsewhere
    return true;
  } else {
    showMessage('密码错误，请重试', 3000);
    return false;
  }
}

