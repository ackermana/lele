// 导入其他模块
import { initFirebase, database } from './firebase-service.js';
import { initUI, updateClock } from './ui-controller.js';
import { initTaskManager } from './task-manager.js';
import { initWishManager } from './wish-manager.js';
import { initPuppy } from './puppy-controller.js';
import { checkAndUpdateDays, resetDailyTasks } from './utils.js';

// 全局变量声明
let loginIdentity = ''; // 记录登录身份：'puppy' 或 'master'

// 初始化应用
function initApp() {
  // 初始化Firebase
  initFirebase();
  
  // 初始化UI组件
  initUI();
  
  // 初始化任务管理
  initTaskManager();
  
  // 初始化愿望管理
  initWishManager();
  
  // 初始化小狗交互
  initPuppy();
  
  // 加载所有数据
  loadAllData();
  
  // 设置定时器
  setInterval(updateClock, 1000);
  setInterval(checkAndUpdateDays, 60000);
  setInterval(resetDailyTasks, 60000);
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);

// 导出全局函数和变量
export { loginIdentity };
