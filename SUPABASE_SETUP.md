# Supabase 后端设置指南

## 概述

使用 **Supabase** 作为后端，完全开源，无需 Google 账号，仅需邮箱即可注册。

功能：
- ✅ 换手机不丢数据
- ✅ 多设备同步
- ✅ 离线可用
- ✅ 完全开源，数据自主可控

---

## 第一步：注册 Supabase 账号

1. 访问 https://supabase.com
2. 点击右上角「Sign Up」
3. 输入你的邮箱地址
4. 去邮箱查收验证邮件，点击链接激活账号

> ⚠️ 注意：Supabase 不支持 QQ 邮箱，建议使用 Gmail、Outlook 或 163 邮箱

---

## 第二步：创建项目

1. 登录后点击「New Project」
2. 填写信息：
   - **Organization**：选择或创建组织（可以写个人名字）
   - **Project Name**：`english-kb`（或你喜欢的名字）
   - **Database Password**：设置一个强密码（保存好！）
   - **Region**：选择 `East Asia (Tokyo)` 或 `Southeast Asia (Singapore)`，离国内近
3. 点击「Create New Project」
4. 等待 1-2 分钟项目创建完成

---

## 第三步：获取 API 密钥

1. 项目创建完成后，点击左侧菜单「Project Settings」（齿轮图标）
2. 选择「API」标签
3. 复制以下信息：
   - **URL**：`https://xxxxxx.supabase.co`
   - **anon public**：`eyJhbGciOiJIUzI1NiIs...`（一长串字符）

---

## 第四步：更新配置文件

1. 打开 `supabase-config.js` 文件
2. 替换以下两行：

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // 粘贴你的 URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // 粘贴你的 anon key
```

例如：
```javascript
const SUPABASE_URL = 'https://abcdef123456.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## 第五步：创建数据库表

1. 在 Supabase 控制台，点击左侧「SQL Editor」
2. 点击「New Query」
3. 粘贴以下 SQL 代码：

```sql
-- 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_anonymous BOOLEAN DEFAULT false,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户学习统计表
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stats JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 词汇掌握度表
CREATE TABLE IF NOT EXISTS word_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  progress JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word_id)
);

-- 启用行级安全（RLS）
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;

-- 创建安全策略：用户只能访问自己的数据
CREATE POLICY "Users can only access their own profile" 
  ON user_profiles FOR ALL 
  USING (auth.uid() = id);

CREATE POLICY "Users can only access their own stats" 
  ON user_stats FOR ALL 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own word progress" 
  ON word_progress FOR ALL 
  USING (auth.uid() = user_id);
```

4. 点击「Run」执行 SQL

---

## 第六步：启用邮箱认证

1. 点击左侧「Authentication」
2. 选择「Providers」标签
3. 确保「Email」已启用（默认就是启用的）
4. 可以关闭「Confirm email」（如果不需要验证邮箱）

---

## 第七步：更新 index.html

把 `index.html` 中引用的 Firebase SDK 换成 Supabase：

**找到这段代码（在 head 中）：**
```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js"></script>
<script src="firebase-config.js"></script>
```

**替换成：**
```html
<!-- Supabase SDK -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="supabase-config.js"></script>
```

**同时把 JavaScript 中的 `initFirebase()` 改成 `initSupabase()`**

---

## 第八步：部署

1. 把整个 `english-kb` 文件夹部署到 Netlify Drop（https://app.netlify.com/drop）
2. 用手机 Safari 打开网址
3. 进入「我的」页面，点击登录

---

## 费用说明

Supabase 免费额度：
- **数据库**：500MB 存储
- **API 请求**：每月无限（但有速率限制）
- **认证用户**：无限
- **带宽**：每月 2GB 传出

对于个人学习使用，免费额度完全够用。

---

## 与 Firebase 的区别

| 特性 | Supabase | Firebase |
|------|----------|----------|
| 所属公司 | 独立开源公司 | Google |
| 账号要求 | 任意邮箱 | 建议 Google 账号 |
| 数据库 | PostgreSQL | Firestore |
| 开源 | ✅ 完全开源 | ❌ 闭源 |
| 数据控制 | 自主可控 | 托管在 Google |
| 国内访问 | 较好 | 一般 |

---

## 故障排除

**登录失败？**
- 检查 `supabase-config.js` 里的 URL 和 Key 是否正确
- 确认 SQL 表已正确创建

**数据不同步？**
- 检查网络连接
- 查看浏览器控制台错误信息
- 确认 RLS 策略已正确设置

**匿名登录后换设备数据没了？**
- 匿名账号是临时的，换设备前请绑定邮箱
- 在「我的」页面退出匿名账号，用邮箱注册登录
