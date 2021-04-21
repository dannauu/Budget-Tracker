const FILES_TO_CACHE = [
    "/",
    "./index.html",
    "./index.js",
    "./styles.css",
    "./manifest.webmanifest",
    "./icons/icon-192x192.png",
    "./icons/icon-512x512.png",
    "/db.js"
  ];
  
  const STATIC_CACHE = "static-cache-v1";
  const DATA_CACHE = "data-cache-v1";
  
  self.addEventListener("install", (evt) => {
    evt.waitUntil(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });
  
  self.addEventListener("activate", (evt) => {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== STATIC_CACHE && key !== DATA_CACHE) {
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  
  self.addEventListener("fetch", (evt) => {
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches.open(DATA_CACHE).then(cache => {
          return fetch(evt.request)
            .then(response => {
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    evt.respondWith(
      fetch(evt.request).catch(() => {
        return caches.match(evt.request).then((response) => {
          if (response) {
            return response;
          } else if (evt.request.headers.get("accept").includes("text/html")) {
            // return the cached home page for all requests for html pages
            return caches.match("/");
          }
        });
      })
    );
  });