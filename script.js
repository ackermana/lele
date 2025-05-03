import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js"; // 导入 getApps 和 getApp
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";

// 全局变量
let score = 0;
let log = [];

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

// --- 修改开始 ---
// 检查是否已存在 Firebase 应用，如果不存在则初始化
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // 获取已存在的默认应用
}
// --- 修改结束 ---

// 现在 getDatabase 函数已经被导入，可以正常使用了
const database = getDatabase(app); // 确保使用获取到的 app 实例

// 从 Firebase 读取积分
function loadScore() {
  console.log("正在从 Firebase 加载数据...");
  
  const scoreRef = ref(database, 'lele/score');  // 修改路径，使用唯一标识符
  onValue(scoreRef, (snapshot) => {
    const val = snapshot.val();
    console.log("加载到积分:", val);
    score = val || 0;
    updateDisplay();
  }, (error) => {
    console.error("读取积分时出错:", error);
  });
  
  const logRef = ref(database, 'lele/log');  // 修改路径，使用唯一标识符
  onValue(logRef, (snapshot) => {
    const val = snapshot.val();
    console.log("加载到日志:", val);
    log = val || [];
    updateDisplay();
  }, (error) => {
    console.error("读取日志时出错:", error);
  });
}

// 保存积分到 Firebase
function saveScore() {
  console.log("正在保存数据到 Firebase...");
  
  set(ref(database, 'lele/score'), score)  // 修改路径，使用唯一标识符
    .then(() => {
      console.log("积分保存成功!");
    })
    .catch((error) => {
      console.error("保存积分时出错:", error);
    });
    
  set(ref(database, 'lele/log'), log)  // 修改路径，使用唯一标识符
    .then(() => {
      console.log("日志保存成功!");
    })
    .catch((error) => {
      console.error("保存日志时出错:", error);
    });
}

// 更新显示
function updateDisplay() {
  document.getElementById('totalScore').textContent = `当前积分：${score}`;
  document.getElementById('log').innerHTML = log
    .slice(-10).reverse().map(entry => 
      `<div>${new Date(entry.time).toLocaleTimeString()} - ${entry.action} 
      <span class="badge">${entry.points > 0 ? '+' : ''}${entry.points}</span></div>`
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
      }
    } else {
      points = type === 'add' ? item.points : -item.points;
      score += points;
      log.push({time: Date.now(), action: item.name, points});
      saveScore(); // 保存到 Firebase
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
    {name: "一天表现良好", points: 10, desc: "最高30"},
    {name: "及时报备", points: 10, desc: "每天"},
    {name: "发语音", points: 5, desc: "每天上限20分"},
    {name: "发照片", points: 5, desc: "每天上限30分"},
    {name: "发视频", points: 5, desc: "每天上限40分+奖"},
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
    {name: "文字涩涩", cost: 40, desc: "次数：9/10"},
    {name: "语音涩涩", cost: 60, desc: "次数：2/10"},
    {name: "神秘礼物", cost: 200, desc: "每次兑换加100"}
  ]
};

// 页面加载完成后初始化
window.onload = function() {
  // 初始化按钮
  Object.keys(rules).forEach(type => {
    const container = document.getElementById(type === 'store' ? 'store' : type);
    rules[type].forEach(item => {
      container.appendChild(createButton(
        type === 'store' ? 'store' : type === 'additions' ? 'add' : 'deduct',
        item
      ));
    });
  });

  // 加载 Firebase 数据
  loadScore();
  
  // 添加调试信息
  console.log("页面初始化完成，已尝试加载数据");
};