/* ============================================================
   東洋医学 学習スイート  Service Worker（オンライン専用）
   ・著作権管理のため、コンテンツを永続キャッシュしない。
   ・すべてのリクエストはネットワークから取得（network-only）。
     → オフラインでは取得できず使用不可。タブを閉じれば何も残らない。
   ・version.json は常にネットから確認。
   ・UPDATE_NOW を受けたら全キャッシュを消してクライアントを更新。
   ※ 利用者の学習履歴・カルテは各アプリの localStorage / IndexedDB に
      保存されており、ここでは扱わない（従来通り保持される）。
   ============================================================ */

self.addEventListener('install', event => {
  self.skipWaiting(); // 事前キャッシュはしない
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // 旧バージョンで作られたキャッシュが残っていればすべて削除
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// network-only：キャッシュへ保存も参照もしない。
// 取得失敗（オフライン等）はそのまま失敗させ、アプリ側で再読み込み画面を出す。
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(fetch(req, { cache: 'no-store' }));
});

// アプリからの指示：全キャッシュを消してクライアントを更新
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'UPDATE_NOW') {
    event.waitUntil((async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      const clients = await self.clients.matchAll();
      clients.forEach(c => c.postMessage({ type: 'UPDATED' }));
    })());
  }
});
