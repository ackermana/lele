// 导入其他模块
import { addLog } from './utils.js';
import { showMessage } from './ui-controller.js';

// 小狗状态
let puppyMood = 'normal'; // 可能的值: happy, normal, sad
let puppyEnergy = 100; // 0-100
let lastPetTime = 0;

// 初始化小狗功能
export function initPuppy() {
  console.log("初始化小狗功能...");
  
  // 获取小狗元素
  const puppy = document.getElementById('puppy');
  const speechBubble = document.getElementById('speechBubble');
  
  if (!puppy || !speechBubble) {
    console.error("未找到小狗或对话气泡元素");
    return;
  }
  
  // 添加点击事件
  puppy.addEventListener('click', () => {
    petPuppy(speechBubble);
  });
  
  // 初始化小狗状态
  updatePuppyState();
  
  // 设置定时器，每分钟更新小狗状态
  setInterval(updatePuppyState, 60000);
}

// 抚摸小狗
function petPuppy(speechBubble) {
  const now = Date.now();
  
  // 防止连续点击
  if (now - lastPetTime < 2000) {
    return;
  }
  
  lastPetTime = now;
  
  // 随机选择一句话
  const phrases = [
    "主人，我爱你~",
    "摸摸~",
    "好舒服啊~",
    "再摸摸~",
    "汪汪！",
    "主人最好了~"
  ];
  
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
  
  // 显示对话
  if (speechBubble) {
    speechBubble.textContent = randomPhrase;
    speechBubble.style.opacity = "1";
    
    // 3秒后隐藏
    setTimeout(() => {
      speechBubble.style.opacity = "0";
    }, 3000);
  }
  
  // 增加能量
  puppyEnergy = Math.min(100, puppyEnergy + 5);
  
  // 更新小狗状态
  updatePuppyState();
  
  // 记录日志
  addLog("抚摸小狗", 0);
}

// 更新小狗状态
function updatePuppyState() {
  // 获取小狗元素
  const puppy = document.getElementById('puppy');
  
  if (!puppy) {
    return;
  }
  
  // 根据能量值确定心情
  if (puppyEnergy > 70) {
    puppyMood = 'happy';
  } else if (puppyEnergy > 30) {
    puppyMood = 'normal';
  } else {
    puppyMood = 'sad';
  }
  
  // 更新小狗图片
  switch (puppyMood) {
    case 'happy':
      puppy.src = 'images/puppy-happy.png';
      break;
    case 'normal':
      puppy.src = 'images/puppy-normal.png';
      break;
    case 'sad':
      puppy.src = 'images/puppy-sad.png';
      break;
  }
  
  // 每小时减少能量
  const hoursPassed = (Date.now() - lastPetTime) / (1000 * 60 * 60);
  puppyEnergy = Math.max(0, puppyEnergy - hoursPassed * 5);
}

// 喂食小狗
export function feedPuppy(foodType) {
  // 获取对话气泡
  const speechBubble = document.getElementById('speechBubble');
  
  if (!speechBubble) {
    return;
  }
  
  // 根据食物类型增加能量
  let energyGain = 0;
  let response = "";
  
  switch (foodType) {
    case 'treat':
      energyGain = 10;
      response = "好吃的零食！汪汪！";
      break;
    case 'meal':
      energyGain = 30;
      response = "美味的正餐！谢谢主人~";
      break;
    case 'special':
      energyGain = 50;
      response = "哇！特别的食物！我爱你主人！";
      break;
    default:
      response = "这是什么？";
      break;
  }
  
  // 增加能量
  puppyEnergy = Math.min(100, puppyEnergy + energyGain);
  
  // 显示对话
  speechBubble.textContent = response;
  speechBubble.style.opacity = "1";
  
  // 3秒后隐藏
  setTimeout(() => {
    speechBubble.style.opacity = "0";
  }, 3000);
  
  // 更新小狗状态
  updatePuppyState();
  
  // 记录日志
  addLog(`喂食小狗: ${foodType}`, 0);
  
  // 显示消息
  showMessage(`成功喂食小狗: ${foodType}`, 2000);
}