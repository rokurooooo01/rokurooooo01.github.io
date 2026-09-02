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

  // Lanyard Spotify Integration
  const DISCORD_ID = "670570026641915914"; // REPLACE THIS WITH YOUR ACTUAL DISCORD ID
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
      
      // Debug: Log this to see exactly what's coming back in the browser console
      console.log("Lanyard Response:", json);

      const user = json.data;
      if (!user) return;

      const statusText = spotifyStatusEl.querySelector(".status-text");
      const albumArtEl = document.getElementById("spotify-album-art");
      let track = null;
      let artist = null;
      let url = null;
      let albumArt = null;

      // 1. Try the dedicated spotify object
      if (user.spotify) {
        track = user.spotify.track;
        artist = user.spotify.artist;
        url = user.spotify.track_url;
        albumArt = user.spotify.album_art;
      } 
      // 2. Search the activities array for "Spotify"
      if (!track && user.activities) {
        const spotifyAct = user.activities.find(act => act.name === "Spotify");
        if (spotifyAct) {
          track = spotifyAct.details;
          artist = spotifyAct.state;
          if (spotifyAct.assets && spotifyAct.assets.large_image) {
            const imgId = spotifyAct.assets.large_image;
            // If it's a Spotify ID (starts with 'spotify:'), convert it to a usable URL
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

  // Update immediately and then every 15 seconds
  updateSpotifyStatus();
  setInterval(updateSpotifyStatus, 15000);

  // --- New Decorations Logic ---

  // 1. Digital Clock
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

  // 3. Gallery Image Expansion (Forza-style)
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
      modalImg.src = ""; // Clear src to avoid flickering on next open
    });
  }
}

// --- Global functions outside DOMContentLoaded ---

function initLoadingScreen() {
  const loadingScreen = document.getElementById("loading-screen");
  const fill = document.getElementById("loading-bar-fill");
  
  if (!loadingScreen || !fill) return;

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 10;
    if (progress > 100) progress = 100;
    fill.style.width = `${progress}%`;
    
    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }
  }, 150);
}

function playClickSound() {
  const audioCtx = new (window.AudioContext || window.AudioContext)();
  const oscillator = audioCtx.createOscillator();
  
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
  
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.1);
}

document.addEventListener("click", (e) => {
  if (e.target.closest(".button")) {
    playClickSound();
  }
});
