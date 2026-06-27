const CACHE_NAME = "yzat-v1";

const arquivos = [
    "./",
    "./index.html",
    "./login.html",
    "./manifest.json",
    "./css/style.css",
    "./js/script.js",
    "./js/login.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(arquivos))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});