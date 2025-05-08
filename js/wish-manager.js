// 愿望管理相关功能
import { wishes, addLog, saveScore } from './utils.js';
import { updateDisplay, showMessage, updatePanelHeight } from './ui-controller.js';
import { loginIdentity } from './app.js';
import { ref, set, database } from './firebase-service.js';

// 初始化愿望管理
export function initWishManager() {
  console.log("初始化愿望管理器...");
  
  // 渲染愿望列表
  renderWishes();
  
  // 添加事件监听器
  document.getElementById('addWishBtn').addEventListener('click', showAddWishForm);
  
  // 添加面板切换事件
  document.getElementById('wishPanel').addEventListener('transitionend', function() {
    updatePanelHeight('wishPanel');
  });
}

// 渲染愿望列表
export function renderWishes() {
  const wishesContainer = document.getElementById('wishItems');
  if (!wishesContainer) return;
  
  // 清空容器
  wishesContainer.innerHTML = '';
  
  // 如果没有愿望，显示提示
  if (wishes.length === 0) {
    wishesContainer.innerHTML = '<div class="note" style="text-align:center;">还没有愿望，点击下方按钮添加</div>';
    return;
  }
  
  // 渲染每个愿望
  wishes.forEach((wish, index) => {
    const wishElement = document.createElement('div');
    wishElement.className = `wish-item ${wish.completed ? 'wish-completed' : ''}`;
    
    // 愿望内容
    wishElement.innerHTML = `
      <input type="checkbox" class="wish-checkbox" id="wish-${index}" ${wish.completed ? 'checked' : ''}>
      <div class="wish-content">
        <div class="wish-name">${wish.name}</div>
        ${wish.description ? `<div class="wish-description">${wish.description}</div>` : ''}
      </div>
      <div class="wish-controls">
        ${index > 0 ? `<button class="move-btn move-up" title="上移"><i class="fas fa-arrow-up"></i></button>` : `<button class="move-btn disabled" title="已是第一项"><i class="fas fa-arrow-up"></i></button>`}
        ${index < wishes.length - 1 ? `<button class="move-btn move-down" title="下移"><i class="fas fa-arrow-down"></i></button>` : `<button class="move-btn disabled" title="已是最后一项"><i class="fas fa-arrow-down"></i></button>`}
        <button class="wish-edit-btn" title="编辑"><i class="fas fa-edit"></i></button>
        <button class="wish-delete-btn" title="删除"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    // 添加到容器
    wishesContainer.appendChild(wishElement);
    
    // 添加复选框事件
    const checkbox = wishElement.querySelector(`#wish-${index}`);
    checkbox.addEventListener('change', () => {
      if (checkbox.checked && !wish.completed) {
        completeWish(index);
      } else if (!checkbox.checked && wish.completed) {
        uncompleteWish(index);
      }
    });
    
    // 添加上移按钮事件
    if (index > 0) {
      const moveUpBtn = wishElement.querySelector('.move-up');
      moveUpBtn.addEventListener('click', () => {
        moveWish(index, 'up');
      });
    }
    
    // 添加下移按钮事件
    if (index < wishes.length - 1) {
      const moveDownBtn = wishElement.querySelector('.move-down');
      moveDownBtn.addEventListener('click', () => {
        moveWish(index, 'down');
      });
    }
    
    // 添加编辑按钮事件
    const editBtn = wishElement.querySelector('.wish-edit-btn');
    editBtn.addEventListener('click', () => {
      editWish(index);
    });
    
    // 添加删除按钮事件
    const deleteBtn = wishElement.querySelector('.wish-delete-btn');
    deleteBtn.addEventListener('click', () => {
      deleteWish(index);
    });
  });
  
  // 更新面板高度
  updatePanelHeight('wishPanel');
}

// 完成愿望
function completeWish(index) {
  const wish = wishes[index];
  if (!wish) return;
  
  // 只有主人可以完成愿望
  if (loginIdentity !== 'master') {
    showMessage("只有主人可以标记愿望为已完成", 3000);
    renderWishes(); // 重新渲染以恢复复选框状态
    return;
  }
  
  // 标记为已完成
  wish.completed = true;
  wish.completedDate = new Date().toISOString();
  
  // 添加日志
  addLog(`实现愿望: ${wish.name}`, 0);
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderWishes();
}

// 取消完成愿望
function uncompleteWish(index) {
  const wish = wishes[index];
  if (!wish) return;
  
  // 只有主人可以取消完成愿望
  if (loginIdentity !== 'master') {
    showMessage("只有主人可以取消标记愿望", 3000);
    renderWishes(); // 重新渲染以恢复复选框状态
    return;
  }
  
  // 标记为未完成
  wish.completed = false;
  wish.completedDate = '';
  
  // 添加日志
  addLog(`取消实现愿望: ${wish.name}`, 0);
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderWishes();
}

// 添加愿望
function addWish(name, description) {
  // 验证输入
  if (!name.trim()) {
    showMessage("愿望名称不能为空", 3000);
    return false;
  }
  
  // 创建新愿望
  const newWish = {
    name: name.trim(),
    description: description.trim(),
    completed: false,
    completedDate: '',
    createdDate: new Date().toISOString()
  };
  
  // 添加到愿望列表
  wishes.push(newWish);
  
  // 添加日志
  addLog(`添加新愿望: ${name}`, 0);
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderWishes();
  
  return true;
}

// 编辑愿望
function editWish(index) {
  const wish = wishes[index];
  if (!wish) return;
  
  // 小狗只能编辑自己的未完成愿望
  if (loginIdentity === 'puppy' && wish.completed) {
    showMessage("已实现的愿望不能编辑", 3000);
    return;
  }
  
  // 创建编辑表单
  const formHTML = `
    <div class="modal-form">
      <h3>编辑愿望</h3>
      <div class="form-group">
        <label for="editWishName">愿望名称:</label>
        <input type="text" id="editWishName" value="${wish.name}" placeholder="输入愿望名称">
      </div>
      <div class="form-group">
        <label for="editWishDescription">描述 (可选):</label>
        <textarea id="editWishDescription" placeholder="输入愿望描述">${wish.description || ''}</textarea>
      </div>
      <div class="form-actions">
        <button id="saveEditWishBtn" class="btn add-btn">保存</button>
        <button id="cancelEditWishBtn" class="btn">取消</button>
      </div>
    </div>
  `;
  
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = formHTML;
  document.body.appendChild(modal);
  
  // 添加事件监听器
  document.getElementById('saveEditWishBtn').addEventListener('click', () => {
    const name = document.getElementById('editWishName').value;
    const description = document.getElementById('editWishDescription').value;
    
    // 验证输入
    if (!name.trim()) {
      showMessage("愿望名称不能为空", 3000);
      return;
    }
    
    // 更新愿望
    const oldName = wish.name;
    wish.name = name.trim();
    wish.description = description.trim();
    
    // 添加日志
    addLog(`编辑愿望: ${oldName} -> ${wish.name}`, 0);
    
    // 保存数据
    saveScore();
    
    // 更新UI
    renderWishes();
    
    // 关闭模态框
    document.body.removeChild(modal);
  });
  
  document.getElementById('cancelEditWishBtn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // 聚焦到名称输入框
  setTimeout(() => {
    document.getElementById('editWishName').focus();
  }, 100);
}

// 删除愿望
function deleteWish(index) {
  const wish = wishes[index];
  if (!wish) return;
  
  // 确认删除
  if (!confirm(`确定要删除愿望"${wish.name}"吗？`)) {
    return;
  }
  
  // 从列表中删除
  wishes.splice(index, 1);
  
  // 添加日志
  addLog(`删除愿望: ${wish.name}`, 0);
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderWishes();
}

// 显示添加愿望表单
function showAddWishForm() {
  // 创建表单HTML
  const formHTML = `
    <div class="modal-form">
      <h3>添加新愿望</h3>
      <div class="form-group">
        <label for="newWishName">愿望名称:</label>
        <input type="text" id="newWishName" placeholder="输入愿望名称">
      </div>
      <div class="form-group">
        <label for="newWishDescription">描述 (可选):</label>
        <textarea id="newWishDescription" placeholder="输入愿望描述"></textarea>
      </div>
      <div class="form-actions">
        <button id="addWishSubmitBtn" class="btn add-btn">添加</button>
        <button id="addWishCancelBtn" class="btn">取消</button>
      </div>
    </div>
  `;
  
  // 创建模态框
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = formHTML;
  document.body.appendChild(modal);
  
  // 添加事件监听器
  document.getElementById('addWishSubmitBtn').addEventListener('click', () => {
    const name = document.getElementById('newWishName').value;
    const description = document.getElementById('newWishDescription').value;
    
    // 添加愿望
    if (addWish(name, description)) {
      // 关闭模态框
      document.body.removeChild(modal);
    }
  });
  
  document.getElementById('addWishCancelBtn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  // 聚焦到名称输入框
  setTimeout(() => {
    document.getElementById('newWishName').focus();
  }, 100);
}

// 移动愿望
function moveWish(index, direction) {
  if (direction === 'up' && index > 0) {
    // 向上移动
    [wishes[index], wishes[index-1]] = [wishes[index-1], wishes[index]];
  } else if (direction === 'down' && index < wishes.length - 1) {
    // 向下移动
    [wishes[index], wishes[index+1]] = [wishes[index+1], wishes[index]];
  } else {
    return; // 无效的移动
  }
  
  // 保存数据
  saveScore();
  
  // 更新UI
  renderWishes();
}

// 切换愿望完成状态
export function toggleWishCompleted(index) {
  const wish = wishes[index];
  if (!wish) return;
  
  if (wish.completed) {
    uncompleteWish(index);
  } else {
    completeWish(index);
  }
}

// 保存愿望到数据库
export function saveWishes() {
  try {
    set(ref(database, 'lele/wishes'), wishes)
      .then(() => {
        console.log("小狗愿望保存成功!");
      })
      .catch((error) => {
        console.error("保存小狗愿望时出错:", error);
      });
  } catch (error) {
    console.error("保存小狗愿望时发生错误:", error);
  }
}