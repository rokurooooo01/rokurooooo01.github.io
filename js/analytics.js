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

  var UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";
  var UMAMI_SITE_ID = "d0b49634-0613-44be-8a0e-350f4a9b2832";

  if (!UMAMI_SCRIPT_URL || !UMAMI_SITE_ID) return;

  var s = document.createElement("script");
  s.src = UMAMI_SCRIPT_URL;
  s.defer = true;
  s.dataset.websiteId = UMAMI_SITE_ID;
  document.body.appendChild(s);
})();