// 导入 Firebase 服务
import { ref, set, get, database } from './firebase-service.js';

// 全局变量
export let score = 0;
export let log = [];
export let wishes = [];
export let dailyTasks = [];
export let accompanyDays = 0;

// 固定的起始日期 - 2023年8月1日
export const startDate = new Date(2023, 7, 1); // 月份是从0开始的，所以7代表8月

// 获取今天的日期字符串 (YYYY-MM-DD格式)
export function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// 添加日志
export function addLog(action, points) {
  const logEntry = {
    action: action,
    points: points,
    time: new Date().toISOString()
  };
  
  log.push(logEntry);
  score += points;
  
  // 保存数据
  saveScore();
  
  // 更新显示
  updateDisplay();
}

// 保存数据到Firebase
export function saveScore() {
  try {
    // 保存积分
    set(ref(database, 'lele/score'), score);
    
    // 保存日志
    set(ref(database, 'lele/log'), log);
    
    // 保存愿望
    set(ref(database, 'lele/wishes'), wishes);
    
    // 保存任务
    set(ref(database, 'lele/dailyTasks'), dailyTasks);
    
    // 保存天数
    set(ref(database, 'lele/accompanyDays'), accompanyDays);
    
    console.log("数据保存成功!");
  } catch (error) {
    console.error("保存数据时出错:", error);
  }
}

// 加载所有数据
export function loadAllData() {
  // 获取积分
  get(ref(database, 'lele/score')).then((snapshot) => {
    if (snapshot.exists()) {
      score = snapshot.val();
      updateDisplay();
    }
  }).catch((error) => {
    console.error("获取积分时出错:", error);
  });
  
  // 获取日志
  get(ref(database, 'lele/log')).then((snapshot) => {
    if (snapshot.exists()) {
      log = snapshot.val();
      updateDisplay();
    }
  }).catch((error) => {
    console.error("获取日志时出错:", error);
  });
  
  // 获取愿望
  get(ref(database, 'lele/wishes')).then((snapshot) => {
    if (snapshot.exists()) {
      wishes = snapshot.val();
      renderWishes();
    }
  }).catch((error) => {
    console.error("获取愿望时出错:", error);
  });
  
  // 获取任务
  get(ref(database, 'lele/dailyTasks')).then((snapshot) => {
    if (snapshot.exists()) {
      dailyTasks = snapshot.val();
      renderTasks();
    }
  }).catch((error) => {
    console.error("获取任务时出错:", error);
  });
  
  // 获取天数
  get(ref(database, 'lele/accompanyDays')).then((snapshot) => {
    if (snapshot.exists()) {
      accompanyDays = snapshot.val();
      updateDaysDisplay();
    }
  }).catch((error) => {
    console.error("获取天数时出错:", error);
  });
}

// 检查并更新天数
export function checkAndUpdateDays() {
  const now = new Date();
  const today = getTodayString();
  const lastUpdateDate = localStorage.getItem('lastUpdateDate');
  
  if (lastUpdateDate !== today) {
    // 更新天数
    accompanyDays = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    
    // 保存最后更新日期
    localStorage.setItem('lastUpdateDate', today);
    
    // 保存数据
    saveScore();
    
    // 更新显示
    updateDaysDisplay();
  }
}

// 重置每日任务
export function resetDailyTasks() {
  const today = getTodayString();
  const lastResetDate = localStorage.getItem('lastResetDate');
  
  // 如果今天还没有重置过
  if (lastResetDate !== today) {
    // 重置每日任务
    dailyTasks.forEach(task => {
      if (task.daily && task.lastCompleted !== today) {
        task.completed = false;
      }
    });
    
    // 保存最后重置日期
    localStorage.setItem('lastResetDate', today);
    
    // 保存数据
    saveScore();
    
    // 更新显示
    renderTasks();
  }
}

// 导入其他模块的函数
import { updateDisplay, updateDaysDisplay } from './ui-controller.js';
import { renderWishes } from './wish-manager.js';
import { renderTasks } from './task-manager.js';