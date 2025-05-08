// 导入其他模块
import { score, log, accompanyDays, startDate } from './utils.js';

// UI更新函数
// UI控制相关功能

// 初始化UI
export function initUI() {
  console.log("初始化UI...");
  
  // 设置面板切换事件
  setupPanelSwitching();
  
  // 其他UI初始化
}

// 显示消息
export function showMessage(message, duration = 2000) {
  const messageElement = document.getElementById('message');
  if (!messageElement) {
    const newMessage = document.createElement('div');
    newMessage.id = 'message';
    document.body.appendChild(newMessage);
    messageElement = newMessage;
  }
  
  messageElement.textContent = message;
  messageElement.classList.add('show');
  
  setTimeout(() => {
    messageElement.classList.remove('show');
  }, duration);
}

// 更新显示
export function updateDisplay() {
  // 更新各种显示元素
  // ...
}

// 更新面板高度
export function updatePanelHeight(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  const content = panel.querySelector('.panel-content');
  if (!content) return;
  
  // 如果面板是隐藏的，不需要更新高度
  if (panel.classList.contains('hidden')) return;
  
  // 计算并设置内容高度
  const contentHeight = content.scrollHeight;
  content.style.height = contentHeight + 'px';
}

// 设置面板切换
function setupPanelSwitching() {
  // 获取所有面板切换按钮
  const panelButtons = document.querySelectorAll('.panel-button');
  
  // 为每个按钮添加点击事件
  panelButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetPanel = button.getAttribute('data-panel');
      if (!targetPanel) return;
      
      // 隐藏所有面板
      document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.add('hidden');
      });
      
      // 显示目标面板
      const panel = document.getElementById(targetPanel);
      if (panel) {
        panel.classList.remove('hidden');
        updatePanelHeight(targetPanel);
      }
      
      // 更新按钮状态
      panelButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
    });
  });
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

function updatePanelHeight(panelId) {
  const panel = document.getElementById(panelId);
  if (panel && panel.style.maxHeight) {
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
}

// 导出函数
export {
  initUI,
  updateDisplay,
  updateDaysDisplay,
  updateClock,
  showMessage,
  updatePanelHeight
};