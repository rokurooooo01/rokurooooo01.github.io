/* Site analytics loader.
 *
 * Umami (https://umami.is) is a privacy-friendly, self-hostable analytics
 * tool — a good companion to Vercel Insights. Host it (free tier works on
 * Cloudflare Workers or Vercel), then paste your assigned values below.
 *
 * Until BOTH constants are filled in, this script does nothing, so the live
 * site stays error-free while you set it up.
 */
(function () {
  "use strict";

  var UMAMI_SCRIPT_URL = ""; // e.g. "https://umami-sigma-jet.vercel.app/script.js"
  var UMAMI_SITE_ID = "";    // e.g. "0d90bc84-b021-43d1-8f19-c976e12021b2"

  if (!UMAMI_SCRIPT_URL || !UMAMI_SITE_ID) return;

  var s = document.createElement("script");
  s.src = UMAMI_SCRIPT_URL;
  s.defer = true;
  s.dataset.websiteId = UMAMI_SITE_ID;
  document.body.appendChild(s);
})();