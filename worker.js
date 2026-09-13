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
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/about/</loc>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/calendar/</loc>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/prasadam/</loc>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/journey/</loc>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/gallery/</loc>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/community/</loc>
  </url>
  <url>
    <loc>https://www.sarvamsabarigireesha.com/contact/</loc>
  </url>
</urlset>`;

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

    return env.ASSETS.fetch(request);

  },

};
