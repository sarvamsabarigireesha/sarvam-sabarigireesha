// ========================================================
// SEO — SITEMAP.XML
// Directly served by Cloudflare Worker
// ========================================================
if (
  url.pathname === "/sitemap.xml" &&
  (
    request.method === "GET" ||
    request.method === "HEAD"
  )
) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
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

  return new Response(
    request.method === "HEAD" ? null : sitemap,
    {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=UTF-8",
        "Cache-Control": "public, max-age=300, must-revalidate",
        "Access-Control-Allow-Origin": "*"
      }
    }
  );
}
