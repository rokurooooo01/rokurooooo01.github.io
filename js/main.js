// Immediate Fail-Safe: Hide loading screen as soon as script starts
(function() {
  setTimeout(() => {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      loadingScreen.style.display = "none";
    }
  }, 1000);

  // Apply saved theme immediately before render to avoid flash
  const savedTheme = localStorage.getItem("retroTheme") || "win95";
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

// Global Audio Mute State
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
        <button class="taskbar-start-btn" onclick="location.href='index.html'">
          <span style="font-weight: 900; color: var(--accent);">🪟</span> Start
        </button>
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

  // Bind theme selector
  const themeSelect = taskbar.querySelector(".theme-select");
  if (themeSelect) {
    themeSelect.value = localStorage.getItem("retroTheme") || "win95";
    themeSelect.addEventListener("change", (e) => setTheme(e.target.value));
  }

  // Bind sound toggle button
  const soundBtn = taskbar.querySelector(".sound-toggle");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => toggleAudioMute());
  }

  // Bind sticker toggle button
  const stickerBtn = taskbar.querySelector(".sticker-toggle");
  if (stickerBtn) {
    stickerBtn.addEventListener("click", () => {
      document.body.classList.toggle("stickers-hidden");
      playClickSound();
    });
  }

  updateMuteUI();

  // Setup window frames
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

document.addEventListener("DOMContentLoaded", () => {
  // KaTeX rendering
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

  // Highlight active sidebar link
  highlightActiveNav();

  // Init taskbar and window controls
  initWindowControlsAndTaskbar();

  // Init draggable stickers
  initDraggableStickers();

  // Random Quote Generator
  const quotes = [
    "The only way to do great work is to love what you do.",
    "Mathematics is the music of reason.",
    "Pure mathematics is, in its way, the poetry of logical ideas.",
    "Stay hungry, stay foolish.",
    "The beautiful thing about learning is that nobody can take it away from you.",
    "Imagination is more important than knowledge."
  ];
  const quoteEl = document.getElementById("random-quote");
  if (quoteEl) {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.textContent = randomQuote;
  }

  // Lanyard Spotify Integration
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

  // Digital Clock
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

  // Gallery Image Expansion
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

// --- Global functions ---

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
