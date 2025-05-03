# 小狗积分系统 🐾

## 项目简介
这是一个为情侣设计的小狗积分系统，用于记录日常互动行为的加分/扣分情况，并可通过积分兑换奖励。

## 功能特性
- 积分加减功能
- 积分兑换商店
- 每日自动更新陪伴天数
- 可爱小狗互动元素
- 数据实时同步到Firebase

## 技术栈
- HTML/CSS/JavaScript
- Firebase Realtime Database

## 文件结构
- `index.html` - 主界面
- `script.js` - 主要业务逻辑
- `puppy.gif` - 小狗图片

## 配置说明
1. 修改`script.js`中的`firebaseConfig`为您自己的Firebase配置
2. 数据库结构要求：
   - `lele/score` - 存储当前积分
   - `lele/log` - 存储操作日志
   - `lele/accompanyDays` - 存储陪伴天数

## 使用说明
1. 打开`index.html`即可使用
2. 点击相应按钮进行加分/扣分操作
3. 点击右下角小狗可互动

## 自定义修改
- 修改`rules`对象可调整加分/扣分项目和商店物品
- 修改CSS样式可调整界面外观
- 修改`puppyPhrases`数组可调整小狗说的话

## 注意事项
- 请确保网络连接正常以使用Firebase功能
- 修改代码前请备份