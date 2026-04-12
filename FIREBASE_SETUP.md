# Firebase 后端设置指南

## 概述

英语知识库现在支持 Firebase 云端同步功能，可以让你的学习数据：
- **永久保存**：换手机不丢数据
- **多设备同步**：手机、平板、电脑数据实时同步
- **离线可用**：没网也能学习，有网自动同步

---

## 第一步：创建 Firebase 项目

1. 访问 https://console.firebase.google.com
2. 点击「创建项目」
3. 输入项目名称，例如：`english-kb-yourname`
4. 一路点击「继续」直到项目创建完成

---

## 第二步：启用身份验证（Authentication）

1. 左侧菜单点击「Authentication」
2. 点击「开始使用」
3. 启用以下登录方式：
   - **匿名**：点击「匿名」→ 启用开关
   - **邮箱/密码**：点击「邮箱/密码」→ 启用「邮箱/密码」开关
4. 点击「保存」

---

## 第三步：创建数据库（Firestore）

1. 左侧菜单点击「Firestore Database」
2. 点击「创建数据库」
3. 选择「以测试模式开始」（方便开发，之后可以改安全规则）
4. 选择数据库位置（建议选 `asia-east1` 台湾，离国内近）
5. 点击「启用」

---

## 第四步：获取配置信息

1. 点击项目概览右侧的「</>」图标（添加应用）
2. 输入应用昵称，例如：`english-kb-web`
3. 点击「注册应用」
4. 复制 `firebaseConfig` 对象里的内容，看起来像这样：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

---

## 第五步：更新配置文件

1. 打开 `firebase-config.js` 文件
2. 找到这一行：
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     ...
   };
   ```
3. 把刚才复制的配置粘贴进去，替换所有 `YOUR_XXX` 的占位符
4. 保存文件

---

## 第六步：部署

把更新后的文件重新部署到 Netlify / Vercel / GitHub Pages，然后：

1. 用手机 Safari 打开网址
2. 进入「我的」页面
3. 点击「免注册快速开始」或「邮箱登录」
4. 登录成功后，数据会自动同步到云端

---

## 安全规则（可选，建议设置）

Firestore 数据库默认测试模式 30 天后会过期，建议设置正式规则：

1. 进入 Firestore Database → 规则
2. 粘贴以下内容：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用户只能读写自己的数据
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /wordProgress/{wordId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

3. 点击「发布」

---

## 费用说明

Firebase 免费额度（Spark 计划）：
- **Authentication**：每月 10,000 次登录
- **Firestore**：每月 50,000 次读取、20,000 次写入、20,000 次删除
- **存储**：1GB 数据

对于个人学习使用，免费额度完全够用。

---

## 故障排除

**登录失败？**
- 检查 `firebase-config.js` 里的配置是否正确
- 确认 Authentication 中已启用对应的登录方式

**数据不同步？**
- 检查网络连接
- 进入「我的」页面点击「同步」按钮手动同步
- 查看浏览器控制台（Safari 开发工具）是否有错误信息

**换手机后数据没了？**
- 确保在新手机上用**同一个账号**登录
- 匿名登录的数据只能在原设备访问，建议注册邮箱账号
