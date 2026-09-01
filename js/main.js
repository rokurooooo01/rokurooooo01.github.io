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
      const { data } = await response.json();

      const spotify = data.spotify;
      const statusText = spotifyStatusEl.querySelector(".status-text");

      if (spotify && spotify.track) {
        const trackName = spotify.track;
        const artistName = spotify.artist;
        
        if (spotify.track_url) {
          statusText.innerHTML = `<a href="${spotify.track_url}" target="_blank" style="color: inherit;">${trackName} by ${artistName}</a>`;
        } else {
          statusText.textContent = `${trackName} by ${artistName}`;
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
});
