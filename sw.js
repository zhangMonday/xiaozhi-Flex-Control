const CACHE_NAME = 'cache-static-v1';
const ASSETS = [
  '/', 
  '/logo/logo.png', 
  '/logo/logo192.png', 
  '/logo/logo512.png'
];

// 安装：预缓存静态资源（不含 HTML）
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// 判断是否为 HTML 导航请求
const isHtmlRequest = request =>
  request.mode === 'navigate' ||
  (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));

// 拦截所有请求
self.addEventListener('fetch', event => {
  const { request } = event;

  // HTML：网络优先 + 强制无缓存 + 更新运行时缓存 + 离线回退
  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(networkResponse => {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 其他资源：缓存优先，未命中再去网络并缓存
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(networkResponse => {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return networkResponse;
      });
    })
  );
});

// 接收来自页面的消息，触发跳过等待
self.addEventListener('message', event => {
  if (event.data?.action === 'skipWaiting') {
    self.skipWaiting();
  }
});
