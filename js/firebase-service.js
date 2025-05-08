// 导入Firebase相关模块
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-analytics.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js";
// 导入配置文件
import { firebaseConfig } from './config.js';

// 全局变量
let app;
let database;

// 初始化Firebase
function initFirebase() {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log("Firebase应用初始化成功");
    } else {
      app = getApp(); // 获取已存在的默认应用
      console.log("获取已存在的Firebase应用");
    }
    database = getDatabase(app);
  } catch (error) {
    console.error("Firebase初始化错误:", error);
  }
}

// 保存数据到Firebase
function saveToFirebase(path, data) {
  return set(ref(database, path), data);
}

// 从Firebase加载数据
function loadFromFirebase(path, callback) {
  const dataRef = ref(database, path);
  return onValue(dataRef, callback);
}

// 导出函数和变量
export { 
  initFirebase, 
  database, 
  saveToFirebase, 
  loadFromFirebase 
};