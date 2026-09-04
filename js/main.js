(function() {
  setTimeout(() => {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
  }, 1000);

  const savedTheme = localStorage.getItem("retroTheme") || "win95";
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

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

function playClickSound() {
  if (isMuted) return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

document.addEventListener("DOMContentLoaded", () => {
  if (window.katex && typeof renderMathInElement === "function") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true },
      ],
      throwOnError: false,
    });
  } else {
    console.warn("KaTeX renderMathInElement not found. Math may not render.");
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

  async function updateSpotifyStatus() {
    if (!spotifyStatusEl) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`, { 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      const json = await response.json();
      
      const user = json.data;
      if (!user) return;

      const statusText = spotifyStatusEl.querySelector(".status-text");
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
    } catch (error) {
      console.error("Error fetching Lanyard status:", error);
    }
  }

  updateSpotifyStatus();
  setInterval(updateSpotifyStatus, 15000);

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
      const [infoRes, artistsRes, tracksRes, albumsRes] = await Promise.all([
        fetch(`${base}&method=user.getInfo`),
        fetch(`${base}&method=user.getTopArtists&period=overall&limit=1`),
        fetch(`${base}&method=user.getTopTracks&period=overall&limit=1`),
        fetch(`${base}&method=user.getTopAlbums&period=overall&limit=1`),
      ]);

      const [info, artists, tracks, albums] = await Promise.all([
        infoRes.json(), artistsRes.json(), tracksRes.json(), albumsRes.json(),
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


function initLoadingScreen() {
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

document.addEventListener("DOMContentLoaded", () => {
  const track = document.getElementById("marquee-track");
  if (!track) return;

  const items = Array.from(track.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });

  let currentTranslate = 0;
  const speed = 0.5; 
  let isPaused = false;

  track.addEventListener("mouseenter", () => isPaused = true);
  track.addEventListener("mouseleave", () => isPaused = false);

  function step() {
    if (!isPaused) {
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
});

window.addEventListener("load", () => {
  const track = document.getElementById("sticker-track");
  if (!track) return;

  const items = Array.from(track.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    track.appendChild(clone);
  });

  let currentTranslate = 0;
  const speed = 0.6;
  let isPaused = false;

  track.addEventListener("mouseenter", () => isPaused = true);
  track.addEventListener("mouseleave", () => isPaused = false);

  function step() {
    if (!isPaused) {
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
});