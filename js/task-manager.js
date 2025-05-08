// 任务管理相关功能
import { dailyTasks, addLog, saveScore, getTodayString } from './utils.js';
import { updateDisplay, showMessage, updatePanelHeight } from './ui-controller.js';
import { loginIdentity } from './app.js';

// 初始化任务管理
export function initTaskManager() {
  console.log("初始化任务管理器...");
  
  // 渲染任务列表
  renderTasks();
  
  // 添加事件监听器
  document.getElementById('addTaskBtn').addEventListener('click', showAddTaskForm);
  
  // 添加面板切换事件
  document.getElementById('dailyTaskPanel').addEventListener('transitionend', function() {
    updatePanelHeight('dailyTaskPanel');
  });
}

// 渲染任务列表
export function renderTasks() {
  const tasksContainer = document.getElementById('dailyTasks');
  if (!tasksContainer) return;
  
  // 清空容器
  tasksContainer.innerHTML = '';
  
  // 如果没有任务，显示提示
  if (dailyTasks.length === 0) {
    tasksContainer.innerHTML = '<div class="note" style="text-align:center;">还没有任务，点击下方按钮添加</div>';
    return;
  }
  
  // 获取今天的日期字符串
  const today = getTodayString();
  
  // 渲染每个任务
  dailyTasks.forEach((task, index) => {
    const taskElement = document.createElement('div');
    taskElement.className = `task-item ${task.completed ? 'task-completed' : ''}`;
    
    // 任务内容
    taskElement.innerHTML = `
      <input type="checkbox" class="task-checkbox" id="task-${index}" ${task.completed ? 'checked' : ''}>
      <div class="task-content">
        <div class="task-name">${task.name}</div>
        <div class="task-points">+${task.points} 积分${task.daily ? ' (每日)' : ''}</div>
      </div>
      <div class="task-controls">
        ${index > 0 ? `<button class="move-btn move-up" title="上移"><i class="fas fa-arrow-up"></i></button>` : `<button class="move-btn disabled" title="已是第一项"><i class="fas fa-arrow-up"></i></button>`}
        ${index < dailyTasks.length - 1 ? `<button class="move-btn move-down" title="下移"><i class="fas fa-arrow-down"></i></button>` : `<button class="move-btn disabled" title="已是最后一项"><i class="fas fa-arrow-down"></i></button>`}
        <button class="task-edit-btn" title="编辑"><i class="fas fa-edit"></i></button>
        <button class="task-delete-btn" title="删除"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    // 添加到容器
    tasksContainer.appendChild(taskElement);
    
    // 添加复选框事件
    const checkbox = taskElement.querySelector(`#task-${index}`);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked && !task.completed) {
        completeTask(index);
      } else if (!checkbox.checked && task.completed) {
        uncompleteTask(index);
      }
    });
    
    // 添加编辑按钮事件
    const editBtn = taskElement.querySelector('.task-edit-btn');
    editBtn.addEventListener('click', () => {
      editTask(index);
    });
    
    // 添加删除按钮事件
    const deleteBtn = taskElement.querySelector('.task-delete-btn');
    deleteBtn.addEventListener('click', () => {
      deleteTask(index);
    });
    
    // 添加上移按钮事件
    if (index > 0) {
      const moveUpBtn = taskElement.querySelector('.move-up');
      moveUpBtn.addEventListener('click', () => {
        moveTask(index, 'up');
      });
    }
    
    // 添加下移按钮事件
    if (index < dailyTasks.length - 1) {
      const moveDownBtn = taskElement.querySelector('.move-down');
      moveDownBtn.addEventListener('click', () => {
        moveTask(index, 'down');
      });
    }
  });
  
  // 更新面板高度
  updatePanelHeight('dailyTaskPanel');
}

// 完成任务
function completeTask(index) {
  const task = dailyTasks[index];
  if (!task) return;
  
  // 标记为已完成
  task.completed = true;
  
  // 如果是每日任务，记录完成日期
  if (task.daily) {
    task.lastCompleted = getTodayString();
  }
  
  // 添加日志
  addLog(`完成任务: ${task.name}`, task.points);
  
  // 更新UI
  renderTasks();
}

// 取消完成任务
function uncompleteTask(index) {
  const task = dailyTasks[index];
  if (!task) return;
  
  // 只有主人可以取消完成任务
  if (loginIdentity !== 'master') {
    showMessage("只有主人可以取消完成任务", 3000);
    renderTasks(); // 重新渲染以恢复复选框状态
    return;
  }
  
  // 标记为未完成
  task.completed = false;
  
  // 如果是每日任务，清除完成日期
  if (task.daily) {
    task.lastCompleted = '';
  }
  
  // 添加日志
  addLog(`取消完成任务: ${task.name}`, -task.points);
  
  // 更新UI
  renderTasks();
}

// 添加任务
function addTask(name, points, daily) {
  // 验证输入
  if (!name.trim()) {
    showMessage("任务名称不能为空", 3000);
    return false;
  }
  
  if (isNaN(points) || points <= 0) {
    showMessage("积分必须是大于0的数字", 3000);
    return false;
  }
  
  // 创建新任务
  const newTask = {
    name: name.trim(),
    points: parseInt(points),
    daily: daily,
    completed: false,
    lastCompleted: ''
  };
  
  // 添加到任务列表
  dailyTasks.push(newTask);
  
  // 添加日志
  addLog(`添加新任务: ${name}`, 0);
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderTasks();
  
  return true;
}

// 编辑任务
function editTask(index) {
  const task = dailyTasks[index];
  if (!task) return;
  
  // 只有主人可以编辑任务
  if (loginIdentity !== 'master') {
    showMessage("只有主人可以编辑任务", 3000);
    return;
  }
  
  // 创建编辑表单
  const formHTML = `
    <div class="modal-form">
      <h3>编辑任务</h3>
      <div class="form-group">
        <label for="editTaskName">任务名称:</label>
        <input type="text" id="editTaskName" value="${task.name}" placeholder="输入任务名称">
      </div>
      <div class="form-group">
        <label for="editTaskPoints">积分:</label>
        <input type="number" id="editTaskPoints" value="${task.points}" min="1" placeholder="输入积分">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="editTaskDaily" ${task.daily ? 'checked' : ''}>
          每日任务（每天自动重置）
        </label>
      </div>
      <div class="form-actions">
        <button id="saveEditTaskBtn" class="btn add-btn">保存</button>
        <button id="cancelEditTaskBtn" class="btn">取消</button>
      </div>
    </div>
  `;
  
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = formHTML;
  document.body.appendChild(modal);
  
  // 添加事件监听器
  document.getElementById('saveEditTaskBtn').addEventListener('click', () => {
    const name = document.getElementById('editTaskName').value;
    const points = parseInt(document.getElementById('editTaskPoints').value);
    const daily = document.getElementById('editTaskDaily').checked;
    
    // 验证输入
    if (!name.trim()) {
      showMessage("任务名称不能为空", 3000);
      return;
    }
    
    if (isNaN(points) || points <= 0) {
      showMessage("积分必须是大于0的数字", 3000);
      return;
    }
    
    // 更新任务
    const oldName = task.name;
    task.name = name.trim();
    task.points = points;
    task.daily = daily;
    
    // 添加日志
    addLog(`编辑任务: ${oldName} -> ${name}`, 0);
    
    // 保存数据
    saveScore();
    
    // 更新UI
    renderTasks();
    
    // 关闭模态框
    document.body.removeChild(modal);
  });
  
  document.getElementById('cancelEditTaskBtn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
}

// 删除任务
function deleteTask(index) {
  const task = dailyTasks[index];
  if (!task) return;
  
  // 只有主人可以删除任务
  if (loginIdentity !== 'master') {
    showMessage("只有主人可以删除任务", 3000);
    return;
  }
  
  // 确认删除
  if (!confirm(`确定要删除任务 "${task.name}" 吗？`)) {
    return;
  }
  
  // 从任务列表中删除
  dailyTasks.splice(index, 1);
  
  // 添加日志
  addLog(`删除任务: ${task.name}`, 0);
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderTasks();
}

// 移动任务
function moveTask(index, direction) {
  // 只有主人可以移动任务
  if (loginIdentity !== 'master') {
    showMessage("只有主人可以移动任务", 3000);
    return;
  }
  
  if (direction === 'up' && index > 0) {
    // 向上移动
    [dailyTasks[index], dailyTasks[index - 1]] = [dailyTasks[index - 1], dailyTasks[index]];
  } else if (direction === 'down' && index < dailyTasks.length - 1) {
    // 向下移动
    [dailyTasks[index], dailyTasks[index + 1]] = [dailyTasks[index + 1], dailyTasks[index]];
  } else {
    return;
  }
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderTasks();
}

// 显示添加任务表单
function showAddTaskForm() {
  // 只有主人可以添加任务
  if (loginIdentity !== 'master') {
    showMessage("只有主人可以添加任务", 3000);
    return;
  }
  
  // 创建添加表单
  const formHTML = `
    <div class="modal-form">
      <h3>添加新任务</h3>
      <div class="form-group">
        <label for="newTaskName">任务名称:</label>
        <input type="text" id="newTaskName" placeholder="输入任务名称">
      </div>
      <div class="form-group">
        <label for="newTaskPoints">积分:</label>
        <input type="number" id="newTaskPoints" min="1" value="10" placeholder="输入积分">
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="newTaskDaily" checked>
          每日任务（每天自动重置）
        </label>
      </div>
      <div class="form-actions">
        <button id="addNewTaskBtn" class="btn add-btn">添加</button>
        <button id="cancelAddTaskBtn" class="btn">取消</button>
      </div>
    </div>
  `;
  
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = formHTML;
  document.body.appendChild(modal);
  
  // 添加事件监听器
  document.getElementById('addNewTaskBtn').addEventListener('click', () => {
    const name = document.getElementById('newTaskName').value;
    const points = parseInt(document.getElementById('newTaskPoints').value);
    const daily = document.getElementById('newTaskDaily').checked;
    
    // 添加任务
    if (addTask(name, points, daily)) {
      // 关闭模态框
      document.body.removeChild(modal);
    }
  });
  
  document.getElementById('cancelAddTaskBtn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // 聚焦到任务名称输入框
  setTimeout(() => {
    document.getElementById('newTaskName').focus();
  }, 100);
}