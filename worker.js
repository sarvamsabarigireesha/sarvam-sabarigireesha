// ============================================================
// Cloudflare Worker — sarvamsabarigireesha.com
//
//   1. 301  non-www  ->  www  (https)   [canonical host]
//   2. 301  http     ->  https           [enforce TLS]
//   3. /sitemap.xml  -> served inline (fresh cache every 5 min)
//   4. everything else -> static assets (env.ASSETS)
//
// NOTE: /robots.txt is intentionally NOT handled here — it is
// served as a static asset so Cloudflare can append its
// managed AI content-signal block, as it does today.
// ============================================================

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.sarvamsabarigireesha.com/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/about/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/calendar/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/prasadam/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/journey/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/gallery/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/community/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/contact/</loc>
    <lastmod>2026-09-22</lastmod>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/pilgrimage/</loc>
    <lastmod>2026-10-06</lastmod>
  </url>
</urlset>`;

const NOT_FOUND = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<title>Page Not Found | Sarvam Sabarigireesha</title>
</head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:4rem 1rem;background:#fff8ec;color:#5b3a1e">
<h1>Page Not Found</h1>
<p>Swamiye Sharanam Ayyappa! The page you are looking for does not exist.</p>
<p><a href="/" style="color:#b45309;font-weight:700">Return to Home &mdash; Sarvam Sabarigireesha</a></p>
</body>
</html>`;

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    // --------------------------------------------------------
    // Canonical host — non-www -> www, http -> https (301)
    // --------------------------------------------------------

    if (
      url.hostname === "sarvamsabarigireesha.com" ||
      url.protocol === "http:"
    ) {

      url.hostname = "www.sarvamsabarigireesha.com";
      url.protocol = "https:";

      return Response.redirect(url.toString(), 301);

    }

    // --------------------------------------------------------
    // SEO — SITEMAP.XML (served inline)
    // --------------------------------------------------------

    if (
      url.pathname === "/sitemap.xml" &&
      (
        request.method === "GET" ||
        request.method === "HEAD"
      )
    ) {

      return new Response(
        request.method === "HEAD" ? null : SITEMAP,
        {
          status: 200,
          headers: {
            "Content-Type":
              "application/xml; charset=UTF-8",
            "Cache-Control":
              "public, max-age=300, must-revalidate",
            "Access-Control-Allow-Origin":
              "*",
          },
        }
      );

    }

    // --------------------------------------------------------
    // Everything else — static site (assets)
    // --------------------------------------------------------

    const res = await env.ASSETS.fetch(request);

    if (res.status === 404) {
      return new Response(NOT_FOUND, {
        status: 404,
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    return res;

  },

};
