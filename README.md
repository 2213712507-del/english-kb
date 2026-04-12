# 英语知识库 - 部署指南

## 🔥 新功能：云端同步

本应用现在支持 **Supabase 云端同步**（开源，无需 Google 账号），让你的学习数据：
- ✅ 换手机不丢数据
- ✅ 多设备实时同步
- ✅ 离线也能学习
- ✅ 完全开源，数据自主可控

**设置方法**：查看 `SUPABASE_SETUP.md` 文件

---

## 方案一：GitHub Pages（推荐，免费稳定）

### 步骤：

1. **注册 GitHub 账号**（如果还没有）：https://github.com/signup

2. **创建新仓库**：
   - 登录 GitHub → 右上角 `+` → `New repository`
   - Repository name: `english-kb`（或其他名字）
   - 选择 `Public`（免费）
   - 点击 `Create repository`

3. **上传文件**：
   - 在仓库页面点击 `uploading an existing file` 链接
   - 把 `english-kb` 文件夹里的所有文件拖进去：
     - index.html
     - manifest.json
     - sw.js
     - icon-120.png, icon-152.png, icon-180.png, icon-192.png, icon-512.png
     - install-guide.html
     - qr.html
   - 点击 `Commit changes`

4. **启用 GitHub Pages**：
   - 仓库页面 → `Settings`（顶部标签）
   - 左侧菜单 → `Pages`
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main` → `/ (root)`
   - 点击 `Save`

5. **等待 1-2 分钟**，然后访问：
   ```
   https://你的用户名.github.io/english-kb/
   ```

6. **iPhone 安装**：
   - 手机 Safari 打开上面的网址
   - 底部分享按钮 → 「添加到主屏幕」→ 添加
   - 完成！

---

## 方案二：Vercel（更快，但需命令行）

如果你熟悉命令行，可以用 Vercel：

```bash
cd english-kb
npx vercel
```

按提示登录/注册，部署后会得到一个 `.vercel.app` 的网址。

---

## 方案三：腾讯云/阿里云对象存储（国内最快）

如果希望国内访问速度最快：

1. 注册腾讯云/阿里云
2. 开通对象存储（COS/OSS）
3. 创建存储桶，开启静态网站托管
4. 上传所有文件
5. 绑定自定义域名（可选）

---

## 文件清单

部署时需要上传的文件：

```
english-kb/
├── index.html          ← 主程序（必需）
├── manifest.json       ← PWA 配置（必需）
├── sw.js               ← 离线缓存（必需）
├── icon-120.png        ← iPhone 图标
├── icon-152.png        ← iPad 图标
├── icon-180.png        ← iPhone Retina 图标
├── icon-192.png        ← Android 图标
├── icon-512.png        ← 大图标
├── install-guide.html  ← 安装说明
└── qr.html             ← 扫码引导页
```

---

## 手机访问地址示例

部署成功后，手机 Safari 打开：

```
https://username.github.io/english-kb/index.html
```

然后按提示添加到主屏幕即可。
