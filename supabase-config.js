/**
 * Supabase 配置 - 英语知识库后端
 * 
 * 使用说明：
 * 1. 访问 https://supabase.com 注册账号（仅需邮箱）
 * 2. 创建新项目
 * 3. 在项目设置中获取 URL 和 Anon Key
 * 4. 在 Database 中创建表结构
 * 5. 替换下方的占位符
 */

// Supabase 配置（已配置）
const SUPABASE_URL = 'https://mgaweochoilikphrcdehy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nYXdlb2NoYmlpa3BocmNkZWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDY5MTEsImV4cCI6MjA5MTEyMjkxMX0.2WNgRMTfJmHUAFpsbohFgpyKd3qQlI7P59w1agVMPoQ';

// 初始化 Supabase 客户端
let supabase = null;
let isSupabaseReady = false;

function initSupabase() {
  // 检查配置是否已填写
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.log('Supabase 未配置，使用本地存储模式');
    return false;
  }
  
  // 检查 Supabase SDK 是否加载
  if (typeof window.supabase === 'undefined') {
    console.log('Supabase SDK 未加载');
    return false;
  }
  
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    
    isSupabaseReady = true;
    console.log('Supabase 初始化成功');
    return true;
  } catch (error) {
    console.error('Supabase 初始化失败:', error);
    return false;
  }
}

// ==================== 用户认证 ====================

const AuthManager = {
  currentUser: null,
  
  // 匿名登录
  async signInAnonymously() {
    if (!isSupabaseReady) return null;
    try {
      // Supabase 不直接支持匿名登录，创建一个随机邮箱的临时账号
      const randomId = Math.random().toString(36).substring(2, 15);
      const email = `temp_${randomId}@englishkb.local`;
      const password = randomId + Date.now();
      
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      this.currentUser = data.user;
      
      // 标记为匿名用户
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        is_anonymous: true,
        created_at: new Date().toISOString()
      });
      
      console.log('匿名登录成功:', data.user.id);
      return data.user;
    } catch (error) {
      console.error('匿名登录失败:', error);
      return null;
    }
  },
  
  // 邮箱密码登录
  async signInWithEmail(email, password) {
    if (!isSupabaseReady) return null;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      this.currentUser = data.user;
      return data.user;
    } catch (error) {
      console.error('邮箱登录失败:', error);
      throw error;
    }
  },
  
  // 注册新用户
  async signUpWithEmail(email, password) {
    if (!isSupabaseReady) return null;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      });
      
      if (error) throw error;
      
      this.currentUser = data.user;
      
      // 创建用户资料
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        is_anonymous: false,
        email: email,
        created_at: new Date().toISOString()
      });
      
      return data.user;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  },
  
  // 退出登录
  async signOut() {
    if (!isSupabaseReady) return;
    await supabase.auth.signOut();
    this.currentUser = null;
  },
  
  // 监听登录状态
  onAuthStateChanged(callback) {
    if (!isSupabaseReady) {
      callback(null);
      return () => {};
    }
    
    // 获取当前会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentUser = session?.user || null;
      callback(this.currentUser);
    });
    
    // 监听状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      this.currentUser = session?.user || null;
      callback(this.currentUser);
    });
    
    return () => subscription.unsubscribe();
  },
  
  // 获取当前用户
  getCurrentUser() {
    return this.currentUser;
  },
  
  // 是否已登录
  isLoggedIn() {
    return !!this.currentUser;
  }
};

// ==================== 数据管理 ====================

const DataManager = {
  // 保存学习统计
  async saveStats(userId, stats) {
    if (!isSupabaseReady) return false;
    try {
      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          stats: stats,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('保存统计失败:', error);
      return false;
    }
  },
  
  // 获取学习统计
  async getStats(userId) {
    if (!isSupabaseReady) return null;
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('stats')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = 未找到
      
      return data?.stats || null;
    } catch (error) {
      console.error('获取统计失败:', error);
      return null;
    }
  },
  
  // 保存单个词汇进度
  async saveWordProgress(userId, wordId, progress) {
    if (!isSupabaseReady) return false;
    try {
      const { error } = await supabase
        .from('word_progress')
        .upsert({
          user_id: userId,
          word_id: wordId,
          progress: progress,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,word_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('保存词汇进度失败:', error);
      return false;
    }
  },
  
  // 批量保存词汇进度
  async saveAllWordProgress(userId, wordProgressMap) {
    if (!isSupabaseReady) return false;
    try {
      const records = Object.entries(wordProgressMap).map(([wordId, progress]) => ({
        user_id: userId,
        word_id: wordId,
        progress: progress,
        updated_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('word_progress')
        .upsert(records, {
          onConflict: 'user_id,word_id'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('批量保存失败:', error);
      return false;
    }
  },
  
  // 获取所有词汇进度
  async getAllWordProgress(userId) {
    if (!isSupabaseReady) return {};
    try {
      const { data, error } = await supabase
        .from('word_progress')
        .select('word_id, progress')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const progress = {};
      data.forEach(item => {
        progress[item.word_id] = item.progress;
      });
      
      return progress;
    } catch (error) {
      console.error('获取词汇进度失败:', error);
      return {};
    }
  }
};

// ==================== 同步管理器 ====================

const SyncManager = {
  isOnline: navigator.onLine,
  pendingSync: false,
  
  init() {
    // 监听网络状态
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('网络已连接，开始同步...');
      this.syncToCloud();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('网络已断开，切换到离线模式');
    });
    
    // 定期自动同步（每 5 分钟）
    setInterval(() => {
      if (this.isOnline && AuthManager.isLoggedIn()) {
        this.syncToCloud();
      }
    }, 5 * 60 * 1000);
  },
  
  // 从云端同步到本地
  async syncFromCloud() {
    if (!isSupabaseReady || !AuthManager.isLoggedIn()) return false;
    
    const userId = AuthManager.getCurrentUser().id;
    
    try {
      // 获取云端统计
      const cloudStats = await DataManager.getStats(userId);
      if (cloudStats) {
        localStorage.setItem('stats', JSON.stringify(cloudStats));
      }
      
      // 获取云端词汇进度
      const cloudProgress = await DataManager.getAllWordProgress(userId);
      if (Object.keys(cloudProgress).length > 0) {
        const localProgress = JSON.parse(localStorage.getItem('wordProgress') || '{}');
        const mergedProgress = this.mergeProgress(localProgress, cloudProgress);
        localStorage.setItem('wordProgress', JSON.stringify(mergedProgress));
      }
      
      console.log('从云端同步完成');
      return true;
    } catch (error) {
      console.error('从云端同步失败:', error);
      return false;
    }
  },
  
  // 从本地同步到云端
  async syncToCloud() {
    if (!isSupabaseReady || !AuthManager.isLoggedIn()) return false;
    
    const userId = AuthManager.getCurrentUser().id;
    
    try {
      // 同步统计
      const localStats = localStorage.getItem('stats');
      if (localStats) {
        await DataManager.saveStats(userId, JSON.parse(localStats));
      }
      
      // 同步词汇进度
      const localProgress = localStorage.getItem('wordProgress');
      if (localProgress) {
        await DataManager.saveAllWordProgress(userId, JSON.parse(localProgress));
      }
      
      console.log('同步到云端完成');
      return true;
    } catch (error) {
      console.error('同步到云端失败:', error);
      return false;
    }
  },
  
  // 合并本地和云端进度
  mergeProgress(local, cloud) {
    const merged = { ...local };
    
    Object.entries(cloud).forEach(([wordId, cloudData]) => {
      const localData = local[wordId];
      
      if (!localData) {
        merged[wordId] = cloudData;
      } else {
        const cloudTime = new Date(cloudData.updatedAt || 0).getTime();
        const localTime = localData.lastStudied || 0;
        
        if (cloudTime > localTime) {
          merged[wordId] = { ...cloudData, lastStudied: cloudTime };
        }
      }
    });
    
    return merged;
  }
};

// 导出（浏览器全局变量 + CommonJS）
if (typeof window !== 'undefined') {
  window.initSupabase = initSupabase;
  window.AuthManager = AuthManager;
  window.DataManager = DataManager;
  window.SyncManager = SyncManager;
  // 标记加载完成
  window.supabaseConfigLoaded = true;
  console.log('Supabase config loaded, AuthManager ready');
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { initSupabase, AuthManager, DataManager, SyncManager };
}
