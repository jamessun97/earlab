const CACHE='earlab-offline-v6';
const SHELL=['/','/index.html','/style.css','/app.js','/sync-core.js','/sync-client.js','/rhythm-bank.js','/question-bank.js','/mixing.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('earlab-offline-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||!SHELL.includes(url.pathname))return;
 // Never cache identity, progress API responses, or sign-in routes.
 event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)))}return response}).catch(async()=>{return await caches.match(request)||await caches.match(url.pathname)||Response.error()}));
});
