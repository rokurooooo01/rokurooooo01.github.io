(function() {
  // Skip the boot animation entirely if it was already shown this session
  if (document.documentElement.classList.contains("skip-boot")) {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
  } else {
    setTimeout(() => {
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) {
        loadingScreen.style.display = "none";
      }
    }, 1000);
  }

  const savedTheme = localStorage.getItem("retroTheme") || "win95";
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

/* ---------- Client-side API cache (stale-while-revalidate) ----------
 * A static site hits third-party APIs (Lanyard, Last.fm) on every page
 * view. This keeps those calls from hammering rate limits and lets repeat
 * visits paint instant-data from localStorage while revalidating in the
 * background.
 *
 * Semantics:
 *   fresh   (now - ts < ttlMs)    -> return cache, no network.
 *   stale   (now - ts < staleMs)  -> return cache, re-fetch in background.
 *   expired (now - ts >= staleMs) -> fetch now.
 *   Network failure falls back to any cached copy; otherwise it throws.
 */
const rokuroCache = {
  get(key) {
    try {
      const raw = localStorage.getItem("rokuro:api:" + key);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem("rokuro:api:" + key, JSON.stringify(val));
    } catch (err) {
      /* storage can be unavailable (private mode / quota) — cache is a bonus */
    }
  },
};

const rokuroInflight = Object.create(null);

function rokuroRefresh(url, key) {
  if (rokuroInflight[key]) return rokuroInflight[key];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  const pending = fetch(url, { signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then((data) => {
      rokuroCache.set(key, { ts: Date.now(), data });
      return data;
    })
    .finally(() => {
      clearTimeout(timeoutId);
      delete rokuroInflight[key];
    });

  rokuroInflight[key] = pending;
  return pending;
}

function rokuroFetchJSON(url, key, ttlMs, staleMs) {
  const cached = rokuroCache.get(key);
  const now = Date.now();

  if (cached) {
    if (now - cached.ts < ttlMs) {
      return Promise.resolve(cached.data); // fresh, no network
    }
    if (now - cached.ts < staleMs) {
      rokuroRefresh(url, key); // stale-while-revalidate
      return Promise.resolve(cached.data);
    }
  }

  return rokuroRefresh(url, key).catch((err) => {
    if (cached) return cached.data; // network failed -> degrade to cache
    throw err;
  });
}

let isMuted = localStorage.getItem("retroSoundMuted") === "true";

function toggleAudioMute() {
  isMuted = !isMuted;
  localStorage.setItem("retroSoundMuted", isMuted ? "true" : "false");
  updateMuteUI();
}

function updateMuteUI() {
  document.querySelectorAll(".sound-toggle").forEach(btn => {
    btn.textContent = isMuted ? "🔇" : "🔊";
    btn.title = isMuted ? "Unmute Sound" : "Mute Sound";
  });
}

// Reuse one AudioContext instead of creating one per click.
let sharedAudioCtx = null;

function getAudioContext() {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Chrome suspends contexts created before user gesture; resume on demand.
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume();
  }
  return sharedAudioCtx;
}

function playClickSound() {
  if (isMuted) return;
  try {
    const audioCtx = getAudioContext();
    const oscillator = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    oscillator.connect(gain);
    gain.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio context failed", e);
  }
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("retroTheme", theme);
  document.querySelectorAll(".theme-select").forEach(select => {
    select.value = theme;
  });
}

function highlightActiveNav() {
  const currentPath = window.location.pathname;
  let pageName = currentPath.substring(currentPath.lastIndexOf("/") + 1);
  if (!pageName || pageName === "") pageName = "index.html";

  document.querySelectorAll(".page-nav .button").forEach(btn => {
    const href = btn.getAttribute("href");
    if (href && (href === pageName || (pageName === "index.html" && href === "index.html"))) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

function initWindowControlsAndTaskbar() {
  let taskbar = document.querySelector(".retro-taskbar");
  if (!taskbar) {
    taskbar = document.createElement("div");
    taskbar.className = "retro-taskbar";
    taskbar.innerHTML = `
      <div class="taskbar-left">
        <button class="taskbar-start-btn">
          <span style="font-weight: 900; color: var(--accent);">🪟</span> Start
        </button>
        <ul class="start-menu"></ul>
        <div class="taskbar-items"></div>
      </div>
      <div class="taskbar-tray">
        <select class="retro-select theme-select" aria-label="Select Theme" title="Switch Theme">
          <option value="win95">Win95 Teal</option>
          <option value="dark">Midnight Dark</option>
          <option value="hotdog">Hotdog Stand</option>
          <option value="matrix">Matrix CRT</option>
        </select>
        <button class="taskbar-tool-btn sound-toggle" aria-label="Toggle Sound" title="Mute/Unmute Sound">🔊</button>
        <button class="taskbar-tool-btn sticker-toggle" title="Toggle Desktop Stickers">🏷️</button>
      </div>
    `;
    document.body.appendChild(taskbar);
  }

  const themeSelect = taskbar.querySelector(".theme-select");
  if (themeSelect) {
    themeSelect.value = localStorage.getItem("retroTheme") || "win95";
    themeSelect.addEventListener("change", (e) => setTheme(e.target.value));
  }

  const soundBtn = taskbar.querySelector(".sound-toggle");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => toggleAudioMute());
  }

  const stickerBtn = taskbar.querySelector(".sticker-toggle");
  if (stickerBtn) {
    stickerBtn.addEventListener("click", () => {
      document.body.classList.toggle("stickers-hidden");
      playClickSound();
    });
  }

  updateMuteUI();

  const taskbarItemsContainer = taskbar.querySelector(".taskbar-items");
  const windowFrames = document.querySelectorAll(".window-frame");

  windowFrames.forEach((frame, index) => {
    if (!frame.id) {
      frame.id = `window-frame-${index}`;
    }

    const controls = frame.querySelectorAll(".window-btn");
    controls.forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        playClickSound();
        const action = btn.textContent.trim();

        if (action === "_" || action === "-") {
          frame.classList.toggle("is-minimized");
          if (frame.classList.contains("is-maximized")) {
            frame.classList.remove("is-maximized");
          }
        } else if (action === "□" || action === "o") {
          frame.classList.toggle("is-maximized");
          if (frame.classList.contains("is-minimized")) {
            frame.classList.remove("is-minimized");
          }
        } else if (action === "×" || action === "x" || action === "X") {
          frame.classList.add("is-closed");
        }
        updateTaskbarItems();
      });
    });

    const titlebar = frame.querySelector(".window-titlebar");
    if (titlebar) {
      titlebar.addEventListener("dblclick", () => {
        frame.classList.toggle("is-minimized");
        updateTaskbarItems();
      });
    }
  });

  function updateTaskbarItems() {
    if (!taskbarItemsContainer) return;
    taskbarItemsContainer.innerHTML = "";

    windowFrames.forEach(frame => {
      const isMinimized = frame.classList.contains("is-minimized");
      const isClosed = frame.classList.contains("is-closed");
      const isMaximized = frame.classList.contains("is-maximized");

      if (isMinimized || isClosed || isMaximized) {
        const titleEl = frame.querySelector(".window-titlebar-label");
        const titleText = titleEl ? titleEl.textContent.trim() : "Window";

        const item = document.createElement("button");
        item.className = `taskbar-item ${(!isMinimized && !isClosed) ? 'active' : ''}`;
        item.innerHTML = `🗔 ${titleText}`;
        item.title = `Restore ${titleText}`;

        item.addEventListener("click", () => {
          playClickSound();
          if (isClosed) {
            frame.classList.remove("is-closed");
            frame.classList.remove("is-minimized");
          } else if (isMinimized) {
            frame.classList.remove("is-minimized");
          } else if (isMaximized) {
            frame.classList.remove("is-maximized");
          } else {
            frame.classList.add("is-minimized");
          }
          updateTaskbarItems();
        });

        taskbarItemsContainer.appendChild(item);
      }
    });
  }

  updateTaskbarItems();
}

function initDraggableStickers() {
  const stickers = document.querySelectorAll(".sticker");
  stickers.forEach(sticker => {
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    sticker.addEventListener("mousedown", (e) => {
      isDragging = true;
      const rect = sticker.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      sticker.style.zIndex = "1000";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      e.preventDefault();
      sticker.style.position = "fixed";
      sticker.style.left = `${e.clientX - offsetX}px`;
      sticker.style.top = `${e.clientY - offsetY}px`;
      sticker.style.right = "auto";
      sticker.style.bottom = "auto";
    });

    document.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        sticker.style.zIndex = "800";
      }
    });
  });
}

function initRunDialog() {
  const runDialog = document.createElement('div');
  runDialog.className = 'run-dialog';
  runDialog.innerHTML = `<div class="dialog-box"><input type="text" placeholder="Run…"/></div>`;
  document.body.appendChild(runDialog);
  const input = runDialog.querySelector('input');
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      runDialog.classList.add('active');
      input.value = '';
      input.focus();
    }
    if (e.key === 'Escape') {
      runDialog.classList.remove('active');
    }
  });
  const pageMap = {};
  document.querySelectorAll('.page-nav .button').forEach(btn => {
    const name = btn.textContent.trim().toLowerCase();
    const href = btn.getAttribute('href');
    if (href) pageMap[name] = href;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim().toLowerCase();
      const target = pageMap[q];
      if (target) {
        location.href = target;
      } else {
        const entry = Object.entries(pageMap).find(([k]) => k.includes(q));
        if (entry) location.href = entry[1];
      }
      runDialog.classList.remove('active');
    }
  });
}

function initStartMenu() {
  const startBtn = document.querySelector('.taskbar-start-btn');
  const menu = document.querySelector('.start-menu');
  if (!startBtn || !menu) return;
  const links = document.querySelectorAll('.page-nav .button');
  links.forEach(link => {
    const li = document.createElement('li');
    li.textContent = link.textContent.trim();
    li.addEventListener('click', () => {
      location.href = link.getAttribute('href');
    });
    menu.appendChild(li);
  });
  startBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('active');
    playClickSound();
  });
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !startBtn.contains(e.target)) {
      menu.classList.remove('active');
    }
  });
}

function initTwitterSearch() {
  const container = document.getElementById('tweets-container');
  if (!container) return;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'tweet-search';
  input.placeholder = 'Search tweets…';
  container.parentNode.insertBefore(input, container);
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    container.querySelectorAll('.card').forEach(card => {
      const txt = card.textContent.toLowerCase();
      card.style.display = txt.includes(q) ? '' : 'none';
    });
  });
}

function initSpotifyProgress() {
  const statusEl = document.getElementById('spotify-status');
  if (!statusEl) return;
  let bar = statusEl.parentNode.querySelector('.spotify-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'spotify-progress';
    bar.innerHTML = '<div class="filled"></div>';
    statusEl.parentNode.appendChild(bar);
  }
  const updateBar = () => {
    if (!window.__spotifyTimestamps) return;
    const now = Date.now() / 1000;
    const { start, end } = window.__spotifyTimestamps;
    if (start && end) {
      const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
      bar.querySelector('.filled').style.width = pct + '%';
    }
  };
  setInterval(updateBar, 5000);
}

function clearSkeletons(root) {
  if (!root) return;
  root.querySelectorAll(".skeleton").forEach(el => el.remove());
}

document.addEventListener("DOMContentLoaded", () => {
  // Only math pages load KaTeX; render silently when present.
  if (window.katex && typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  }

  console.log("GitHub Pages site is ready.");

  highlightActiveNav();

  initWindowControlsAndTaskbar();

  initDraggableStickers();
  initRunDialog();
  initStartMenu();
  initTwitterSearch();
  initSpotifyProgress();

  const quotes = [
    "The only way to do great work is to love what you do.",
    "Mathematics is the music of reason.",
    "Pure mathematics is, in its way, the poetry of logical ideas.",
    "Stay hungry, stay foolish.",
    "The beautiful thing about learning is that nobody can take it away from you.",
    "Imagination is more important than knowledge.",
  ];
  const quoteEl = document.getElementById("random-quote");
  if (quoteEl) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.textContent = randomQuote;
  }

  const DISCORD_ID = "670570026641915914"; 
  const spotifyStatusEl = document.getElementById("spotify-status");

  // Shared by the Now Playing + Discord widgets: Lanyard is fetched just
  // once per cache cycle (and single-flight), not once per widget.
  function getLanyardPresence() {
    const url = `https://api.lanyard.rest/v1/users/${DISCORD_ID}`;
    return rokuroFetchJSON(url, "lanyard", 10 * 1000, 60 * 60 * 1000)
      .then((json) => (json && json.data) || null);
  }

  async function updateSpotifyStatus() {
    if (!spotifyStatusEl) return;

    const statusText = spotifyStatusEl.querySelector(".status-text");

    try {
      const user = await getLanyardPresence();
      if (!user) {
        if (statusText) statusText.textContent = "no presence data";
        clearSkeletons(spotifyStatusEl);
        return;
      }

      const albumArtEl = document.getElementById("spotify-album-art");
      let track = null;
      let artist = null;
      let url = null;
      let albumArt = null;

      if (user.spotify) {
  track = user.spotify.track;
  artist = user.spotify.artist;
  url = user.spotify.track_url;
  albumArt = user.spotify.album_art;
  if (user.spotify.timestamps) {
    const ts = user.spotify.timestamps;
    window.__spotifyTimestamps = {
      start: ts.start / 1000,
      end: ts.end / 1000,
    };
  } else {
    window.__spotifyTimestamps = null;
  }
} 
      if (!track && user.activities) {
        const spotifyAct = user.activities.find(act => act.name === "Spotify");
        if (spotifyAct) {
          track = spotifyAct.details;
          artist = spotifyAct.state;
          if (spotifyAct.assets && spotifyAct.assets.large_image) {
            const imgId = spotifyAct.assets.large_image;
            if (imgId.startsWith('spotify:')) {
              const id = imgId.split(':')[1];
              albumArt = `https://i.scdn.co/image/${id}`;
            } else if (imgId.startsWith('http')) {
              albumArt = imgId;
            }
          }
        }
      }

      if (track && artist) {
        if (albumArt && albumArtEl) {
          albumArtEl.src = albumArt;
        }
        if (url) {
          statusText.innerHTML = `<a href="${url}" target="_blank" style="color: inherit;">${track} by ${artist}</a>`;
        } else {
          statusText.textContent = `${track} by ${artist}`;
        }
      } else {
        statusText.textContent = "Nothing right now";
      }
      clearSkeletons(spotifyStatusEl);
    } catch (error) {
      console.error("Error fetching Lanyard status:", error);
      if (statusText) statusText.textContent = "couldn't reach now playing";
      clearSkeletons(spotifyStatusEl);
    }
  }

  updateSpotifyStatus();
  setInterval(updateSpotifyStatus, 15000);

  async function updateDiscordPresence() {
    const discordCard = document.querySelector(".discord-card");
    if (!discordCard) return;

    const avatarEl = document.getElementById("discord-avatar");
    const nameEl = document.getElementById("discord-name");
    const statusLabelEl = document.getElementById("discord-status-label");
    const activityEl = document.getElementById("discord-activity");
    const dotEl = document.getElementById("discord-dot");

    try {
      const data = (await getLanyardPresence()) || {};

      // Avatar comes from Lanyard's free quicklink icons; fall back to the
      // site's own profile art if the account has no avatar or went offline.
      if (avatarEl) {
        avatarEl.onerror = () => {
          avatarEl.onerror = null;
          avatarEl.src = "images/profile.svg";
        };
        avatarEl.src = `https://api.lanyard.rest/${DISCORD_ID}.png`;
        avatarEl.alt = `Discord avatar of ${data.discord_user?.username || "rokurooooo"}`;
      }
      if (nameEl) nameEl.textContent = data.discord_user?.username || "rokurooooo";

      const status = data.discord_status || "offline";
      const labels = {
        online: "online",
        idle: "idle",
        dnd: "do not disturb",
        offline: "offline",
      };
      if (statusLabelEl) statusLabelEl.textContent = labels[status] || status;
      if (dotEl) dotEl.dataset.status = status;

      if (activityEl) {
        const custom = data.custom_status;
        if (custom && (custom.text || custom.emoji)) {
          activityEl.textContent = `${custom.emoji || ""} ${custom.text || ""}`.trim();
        } else if (Array.isArray(data.activities) && data.activities.length > 0) {
          const act = data.activities[0];
          activityEl.textContent = `${act.name || "activity"} — ${act.details || act.state || ""}`.replace(/ — $/, "");
        } else {
          activityEl.textContent = "no activity to share";
        }
      }
    } catch (error) {
      console.error("Error fetching Discord presence:", error);
      if (activityEl) activityEl.textContent = "couldn't reach presence";
      if (dotEl) dotEl.dataset.status = "offline";
    }
  }

  updateDiscordPresence();
  setInterval(updateDiscordPresence, 30000);

  async function loadLastFmStats() {
    const LASTFM_API_KEY = "7b2a3746acd2278d3b703db77c523127";
    const LASTFM_USER = "rokurooooo";
    const base = `https://ws.audioscrobbler.com/2.0/?format=json&api_key=${LASTFM_API_KEY}&user=${LASTFM_USER}`;

    const scrobblesEl = document.getElementById("lfm-scrobbles");
    const artistsEl   = document.getElementById("lfm-artists");
    const tracksEl    = document.getElementById("lfm-tracks");
    const albumsEl    = document.getElementById("lfm-albums");
    const sinceEl     = document.getElementById("lfm-since");

    if (!scrobblesEl) return; 

    try {
      // Scrobble totals barely change hour-to-hour, so cache them for 10
      // minutes and keep up to a day of history as an offline fallback.
      const ttl = 10 * 60 * 1000;
      const stale = 24 * 60 * 60 * 1000;

      const [info, artists, tracks, albums] = await Promise.all([
        rokuroFetchJSON(`${base}&method=user.getInfo`, "lastfm:getInfo", ttl, stale),
        rokuroFetchJSON(`${base}&method=user.getTopArtists&period=overall&limit=1`, "lastfm:topArtists", ttl, stale),
        rokuroFetchJSON(`${base}&method=user.getTopTracks&period=overall&limit=1`, "lastfm:topTracks", ttl, stale),
        rokuroFetchJSON(`${base}&method=user.getTopAlbums&period=overall&limit=1`, "lastfm:topAlbums", ttl, stale),
      ]);

      const fmt = n => Number(n).toLocaleString();

      if (info.user) {
        scrobblesEl.textContent = fmt(info.user.playcount);
        const reg = new Date(info.user.registered["#text"] * 1000);
        sinceEl.textContent = `scrobbling since ${reg.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
      }
      if (artists.topartists?.["@attr"]) {
        artistsEl.textContent = fmt(artists.topartists["@attr"].total);
      }
      if (tracks.toptracks?.["@attr"]) {
        tracksEl.textContent = fmt(tracks.toptracks["@attr"].total);
      }
      if (albums.topalbums?.["@attr"]) {
        albumsEl.textContent = fmt(albums.topalbums["@attr"].total);
      }
    } catch (err) {
      console.error("Last.fm stats error:", err);
      if (sinceEl) sinceEl.textContent = "couldn't load stats";
    } finally {
      clearSkeletons(document.querySelector(".lastfm-body"));
    }
  }

  loadLastFmStats();

  const clockEl = document.getElementById("site-clock");
  if (clockEl) {
    function updateClock() {
      const now = new Date();
      clockEl.textContent = now.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: 'numeric', 
        second: 'numeric', 
        hour12: true 
      });
    }
    setInterval(updateClock, 1000);
    updateClock();
  }

  const modal = document.getElementById("image-modal");
  const modalImg = modal ? modal.querySelector("img") : null;

  if (modal && modalImg) {
    document.querySelectorAll(".photo-card").forEach(card => {
      card.addEventListener("click", () => {
        const bg = card.style.backgroundImage;
        const urlMatch = bg.match(/url\(['"]?(.*?)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          modalImg.src = urlMatch[1];
          modal.style.display = "flex";
        }
      });
    });

    modal.addEventListener("click", () => {
      modal.style.display = "none";
      modalImg.src = ""; 
    });
  }
});

/* Visitor counter — uses countapi.xyz (free, no auth) for a global count,
   with a localStorage fallback so the counter always shows something. */
(function initVisitorCounter() {
  const counterEl = document.getElementById("visitor-counter");
  if (!counterEl) return;

  const digits = counterEl.querySelectorAll(".counter-digit");
  const KEY = "rokuro-visitor-count";
  const NS = "rokurooooo01-github-io";
  const HIT_URL = `https://api.countapi.xyz/hit/${NS}/visitors`;

  function pad(n, len) {
    return String(n).padStart(len, "0");
  }

  function render(count) {
    const str = pad(count, digits.length);
    digits.forEach((d, i) => { d.textContent = str[i] || "0"; });
  }

  // Show cached value immediately so the counter never sits at 00000000.
  const cached = localStorage.getItem(KEY);
  if (cached) render(Number(cached));

  // Increment the global counter and update the display.
  rokuroFetchJSON(HIT_URL, null, 0, 0)
    .then((data) => {
      const count = data?.value ?? null;
      if (count != null) {
        localStorage.setItem(KEY, String(count));
        render(count);
      }
    })
    .catch(() => {
      // Offline / API down: fall back to a localStorage visit counter
      // so the counter still ticks up on this device.
      const local = Number(localStorage.getItem(KEY) || "0") + 1;
      localStorage.setItem(KEY, String(local));
      render(local);
    });
})();


function initLoadingScreen() {
  // Boot animation already shown this session — do nothing.
  if (document.documentElement.classList.contains("skip-boot")) return;

  const loadingScreen = document.getElementById("loading-screen");
  const fill = document.getElementById("loading-bar-fill");
  
  if (!loadingScreen || !fill) return;

  const failSafeTimeout = setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 5000);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 100) progress = 100;
      fill.style.width = `${progress}%`;
      
      if (progress === 100) {
        clearTimeout(failSafeTimeout);
        clearInterval(interval);
        sessionStorage.setItem("bootSeen", "true");
        setTimeout(() => {
          loadingScreen.style.display = "none";
        }, 500);
      }
    }, 150);
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".button") || e.target.closest(".taskbar-start-btn") || e.target.closest(".taskbar-item")) {
    playClickSound();
  }
});

/**
 * Infinite horizontal marquee.
 * - Clones content until it fills `minFillWidth` (or 2x its own width).
 * - Pauses on hover and while the tab is hidden.
 * - Renders statically when the user prefers reduced motion.
 */
function initMarquee(track, speed, minFillWidth) {
  if (!track || track.dataset.marqueeReady === "true") return;
  track.dataset.marqueeReady = "true";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    document.documentElement.classList.add("marquee-static");
    return; // leave content as a static row
  }

  const originalContent = Array.from(track.children);
  // Fill enough width so the loop is seamless (2x own width at minimum).
  let guard = 0;
  while (track.scrollWidth < Math.max(minFillWidth || 0, track.scrollWidth * 2) && guard < 50) {
    originalContent.forEach(item => track.appendChild(item.cloneNode(true)));
    guard++;
  }

  let currentTranslate = 0;
  let isPaused = false;
  let isHidden = false;

  track.addEventListener("mouseenter", () => (isPaused = true));
  track.addEventListener("mouseleave", () => (isPaused = false));
  document.addEventListener("visibilitychange", () => {
    isHidden = document.hidden;
  });

  function step() {
    if (!isPaused && !isHidden) {
      currentTranslate -= speed;
      const halfWidth = track.scrollWidth / 2;
      if (Math.abs(currentTranslate) >= halfWidth) {
        currentTranslate = 0;
      }
      track.style.transform = `translateX(${currentTranslate}px)`;
    }
    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

document.addEventListener("DOMContentLoaded", () => {
  initMarquee(document.getElementById("marquee-track"), 0.5, 0);
});

window.addEventListener("load", () => {
  initMarquee(document.getElementById("sticker-track"), 0.6, window.innerWidth * 3);
});

// Changelog deep links — copy link to a specific update
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".til-copy");
  if (!btn) return;
  const target = btn.dataset.target;
  if (!target) return;
  const url = `${window.location.origin}${window.location.pathname}#${target}`;
  navigator.clipboard.writeText(url).then(() => {
    btn.textContent = "copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "link";
      btn.classList.remove("copied");
    }, 1500);
  }).catch(() => {
    btn.textContent = "failed";
    setTimeout(() => {
      btn.textContent = "link";
    }, 1500);
  });
});

// Scroll to changelog entry on page load if URL has a hash
window.addEventListener("load", () => {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const el = document.getElementById(hash);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.transition = "background 0.3s ease";
    const oldBg = el.style.backgroundColor;
    el.style.backgroundColor = "rgba(0, 128, 128, 0.15)";
    setTimeout(() => {
      el.style.backgroundColor = oldBg;
    }, 2000);
  }
});
