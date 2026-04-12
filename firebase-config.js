/**
 * Firebase 配置 - 英语知识库后端
 * 
 * 使用说明：
 * 1. 访问 https://console.firebase.google.com 创建项目
 * 2. 启用 Authentication（身份验证）和 Firestore Database（数据库）
 * 3. 在项目设置中获取配置，替换下方的占位符
 * 4. 在 Firestore 安全规则中设置适当权限
 */

// Firebase 配置（需要用户自行替换）
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化 Firebase（如果配置有效）
let app = null;
let auth = null;
let db = null;
let isFirebaseReady = false;

function initFirebase() {
  // 检查配置是否已填写
  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.log("Firebase 未配置，使用本地存储模式");
    return false;
  }
  
  try {
    // 动态加载 Firebase SDK
    if (typeof firebase === 'undefined') {
      console.log("Firebase SDK 未加载");
      return false;
    }
    
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    
    // 启用离线持久化
    db.enablePersistence({ synchronizeTabs: true })
      .then(() => console.log("Firestore 离线持久化已启用"))
      .catch(err => console.log("离线持久化失败:", err));
    
    isFirebaseReady = true;
    console.log("Firebase 初始化成功");
    return true;
  } catch (error) {
    console.error("Firebase 初始化失败:", error);
    return false;
  }
}

// ==================== 用户认证 ====================

const AuthManager = {
  currentUser: null,
  
  // 匿名登录（最简单，无需输入）
  async signInAnonymously() {
    if (!isFirebaseReady) return null;
    try {
      const result = await auth.signInAnonymously();
      this.currentUser = result.user;
      console.log("匿名登录成功:", result.user.uid);
      return result.user;
    } catch (error) {
      console.error("匿名登录失败:", error);
      return null;
    }
  },
  
  // 邮箱密码登录
  async signInWithEmail(email, password) {
    if (!isFirebaseReady) return null;
    try {
      const result = await auth.signInWithEmailAndPassword(email, password);
      this.currentUser = result.user;
      return result.user;
    } catch (error) {
      console.error("邮箱登录失败:", error);
      throw error;
    }
  },
  
  // 注册新用户
  async signUpWithEmail(email, password) {
    if (!isFirebaseReady) return null;
    try {
      const result = await auth.createUserWithEmailAndPassword(email, password);
      this.currentUser = result.user;
      // 创建用户初始数据
      await DataManager.createUserProfile(result.user.uid);
      return result.user;
    } catch (error) {
      console.error("注册失败:", error);
      throw error;
    }
  },
  
  // Google 登录
  async signInWithGoogle() {
    if (!isFirebaseReady) return null;
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await auth.signInWithPopup(provider);
      this.currentUser = result.user;
      // 检查是否新用户，创建初始数据
      await DataManager.createUserProfileIfNotExists(result.user.uid);
      return result.user;
    } catch (error) {
      console.error("Google 登录失败:", error);
      throw error;
    }
  },
  
  // 退出登录
  async signOut() {
    if (!isFirebaseReady) return;
    await auth.signOut();
    this.currentUser = null;
  },
  
  // 监听登录状态
  onAuthStateChanged(callback) {
    if (!isFirebaseReady) {
      callback(null);
      return () => {};
    }
    return auth.onAuthStateChanged(user => {
      this.currentUser = user;
      callback(user);
    });
  },
  
  // 获取当前用户
  getCurrentUser() {
    return this.currentUser || (auth ? auth.currentUser : null);
  },
  
  // 是否已登录
  isLoggedIn() {
    return !!this.getCurrentUser();
  }
};

// ==================== 数据管理 ====================

const DataManager = {
  // 创建用户初始资料
  async createUserProfile(userId) {
    if (!isFirebaseReady) return;
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastSync: firebase.firestore.FieldValue.serverTimestamp(),
      stats: {
        totalWords: 0,
        totalSentences: 0,
        studyDays: 0,
        currentStreak: 0,
        lastStudyDate: null,
        xp: 0,
        level: 'A1'
      }
    });
  },
  
  // 如果不存在则创建
  async createUserProfileIfNotExists(userId) {
    if (!isFirebaseReady) return;
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();
    if (!doc.exists) {
      await this.createUserProfile(userId);
    }
  },
  
  // 保存学习数据
  async saveStudyData(userId, data) {
    if (!isFirebaseReady) return false;
    try {
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        studyData: data,
        lastSync: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("保存数据失败:", error);
      return false;
    }
  },
  
  // 获取学习数据
  async getStudyData(userId) {
    if (!isFirebaseReady) return null;
    try {
      const userRef = db.collection('users').doc(userId);
      const doc = await userRef.get();
      if (doc.exists) {
        return doc.data().studyData || null;
      }
      return null;
    } catch (error) {
      console.error("获取数据失败:", error);
      return null;
    }
  },
  
  // 保存词汇掌握度
  async saveWordProgress(userId, wordId, progress) {
    if (!isFirebaseReady) return false;
    try {
      const progressRef = db.collection('users').doc(userId).collection('wordProgress').doc(wordId);
      await progressRef.set({
        ...progress,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("保存词汇进度失败:", error);
      return false;
    }
  },
  
  // 批量保存词汇进度
  async saveAllWordProgress(userId, wordProgressMap) {
    if (!isFirebaseReady) return false;
    try {
      const batch = db.batch();
      const collectionRef = db.collection('users').doc(userId).collection('wordProgress');
      
      Object.entries(wordProgressMap).forEach(([wordId, progress]) => {
        const docRef = collectionRef.doc(wordId);
        batch.set(docRef, {
          ...progress,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      
      await batch.commit();
      
      // 更新最后同步时间
      await db.collection('users').doc(userId).update({
        lastSync: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      return true;
    } catch (error) {
      console.error("批量保存失败:", error);
      return false;
    }
  },
  
  // 获取所有词汇进度
  async getAllWordProgress(userId) {
    if (!isFirebaseReady) return {};
    try {
      const snapshot = await db.collection('users').doc(userId).collection('wordProgress').get();
      const progress = {};
      snapshot.forEach(doc => {
        progress[doc.id] = doc.data();
      });
      return progress;
    } catch (error) {
      console.error("获取词汇进度失败:", error);
      return {};
    }
  },
  
  // 保存学习统计
  async saveStats(userId, stats) {
    if (!isFirebaseReady) return false;
    try {
      await db.collection('users').doc(userId).update({
        stats: stats,
        lastSync: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("保存统计失败:", error);
      return false;
    }
  },
  
  // 获取学习统计
  async getStats(userId) {
    if (!isFirebaseReady) return null;
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (doc.exists) {
        return doc.data().stats || null;
      }
      return null;
    } catch (error) {
      console.error("获取统计失败:", error);
      return null;
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
      console.log("网络已连接，开始同步...");
      this.syncToCloud();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log("网络已断开，切换到离线模式");
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
    if (!isFirebaseReady || !AuthManager.isLoggedIn()) return false;
    
    const userId = AuthManager.getCurrentUser().uid;
    
    try {
      // 获取云端统计
      const cloudStats = await DataManager.getStats(userId);
      if (cloudStats) {
        localStorage.setItem('stats', JSON.stringify(cloudStats));
      }
      
      // 获取云端词汇进度
      const cloudProgress = await DataManager.getAllWordProgress(userId);
      if (Object.keys(cloudProgress).length > 0) {
        // 合并本地和云端数据（以时间戳为准）
        const localProgress = JSON.parse(localStorage.getItem('wordProgress') || '{}');
        const mergedProgress = this.mergeProgress(localProgress, cloudProgress);
        localStorage.setItem('wordProgress', JSON.stringify(mergedProgress));
      }
      
      console.log("从云端同步完成");
      return true;
    } catch (error) {
      console.error("从云端同步失败:", error);
      return false;
    }
  },
  
  // 从本地同步到云端
  async syncToCloud() {
    if (!isFirebaseReady || !AuthManager.isLoggedIn()) return false;
    
    const userId = AuthManager.getCurrentUser().uid;
    
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
      
      console.log("同步到云端完成");
      return true;
    } catch (error) {
      console.error("同步到云端失败:", error);
      return false;
    }
  },
  
  // 合并本地和云端进度（以更新时间为准）
  mergeProgress(local, cloud) {
    const merged = { ...local };
    
    Object.entries(cloud).forEach(([wordId, cloudData]) => {
      const localData = local[wordId];
      
      if (!localData) {
        // 本地没有，使用云端数据
        merged[wordId] = cloudData;
      } else {
        // 比较时间戳
        const cloudTime = cloudData.updatedAt?.toMillis?.() || 0;
        const localTime = localData.lastStudied || 0;
        
        if (cloudTime > localTime) {
          merged[wordId] = { ...cloudData, lastStudied: cloudTime };
        }
      }
    });
    
    return merged;
  }
};

// 导出（如果支持模块）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { firebaseConfig, initFirebase, AuthManager, DataManager, SyncManager };
}
