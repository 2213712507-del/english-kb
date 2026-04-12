// Service Worker - 英语知识库 PWA
// 版本号：每次更新内容时修改此版本以触发缓存刷新
const CACHE_NAME = 'eng-kb-v5';

// 需要缓存的文件列表
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// ========== 安装阶段：缓存所有资源 ==========
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] 缓存核心资源...');
      return cache.addAll(CACHE_URLS).catch(err => {
        console.warn('[SW] 部分缓存失败，继续安装:', err);
      });
    }).then(() => {
      console.log('[SW] 安装完成，强制激活');
      return self.skipWaiting();
    })
  );
});

// ========== 激活阶段：清理旧缓存 ==========
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] 删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] 激活完成，接管所有客户端');
      return self.clients.claim();
    })
  );
});

// ========== 请求拦截：网络优先，缓存备用 ==========
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // 跳过 chrome-extension 和非 http/https 请求
  if (!url.startsWith('http')) return;

  // 跳过 Supabase API 请求（这些不能被 SW 缓存）
  if (url.includes('supabase') || url.includes('siliconflow')) return;

  event.respondWith(
    // 首先尝试网络请求（确保获取最新内容）
    fetch(event.request).then(networkResponse => {
      // 如果网络成功，缓存响应（如果是导航请求）
      if (networkResponse && networkResponse.status === 200) {
        // 对于导航请求，总是缓存最新版本
        if (event.request.mode === 'navigate') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
      }
      return networkResponse;
    }).catch(() => {
      // 网络失败时，尝试从缓存获取
      return caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // 对于导航请求，返回 index.html
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html').then(response => {
            if (response) return response;
            return caches.match('/');
          });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
