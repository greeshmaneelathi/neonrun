const CACHE = 'neonrun-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/style.css',
  '/js/main.js',
  '/js/SoundManager.js',
  '/js/supabase.js',
  '/js/scenes/BootScene.js',
  '/js/scenes/MenuScene.js',
  '/js/scenes/GameScene.js',
  '/js/scenes/UIScene.js',
  '/js/scenes/GameOverScene.js',
  '/js/objects/Player.js',
  '/js/objects/LevelGenerator.js',
  '/js/objects/PowerUp.js',
  '/js/objects/WorldEffects.js',
  '/js/objects/AirCollectibles.js',
  '/js/themes/ThemeConfig.js',
  '/js/themes/ThemeAssetGenerator.js',
  '/js/characters/CharacterConfig.js',
  '/js/characters/CharacterGenerator.js',
  'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.url.startsWith(self.location.origin)) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
