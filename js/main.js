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

  // Update immediately and then every 30 seconds
  updateSpotifyStatus();
  setInterval(updateSpotifyStatus, 30000);

  // --- New Decorations Logic ---

  // 1. Digital Clock
  const clockEl = document.getElementById("site-clock");
  if (clockEl) {
    function updateClock() {
      const now = new Date();
      clockEl.textContent = now.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        second: '2-digit', 
        hour12: true 
      }) + " | " + now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  // 2. Random Quote
  const quoteEl = document.getElementById("random-quote");
  if (quoteEl) {
    const quotes = [
      "Mathematics is the music of reason.",
      "Pure mathematics is, in its way, the poetry of logical ideas.",
      "Nature is written in mathematical language.",
      "The only way to learn mathematics is to do mathematics.",
      "Imagination is more important than knowledge.",
      "The essence of mathematics is not to make simple things complicated, but to make complicated things simple.",
      "Every great mathematical discovery is a simple idea that was very hard to find.",
      "Mathematics is a place where you can do and explore things that you can't do in the real world."
    ];
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.textContent = `"${randomQuote}"`;
  }
});
