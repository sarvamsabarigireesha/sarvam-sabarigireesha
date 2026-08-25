// ============================================================
// Cloudflare Worker — Prasadam Lottery + Website + SEO
// ============================================================
//
// API:
//   POST /register
//   POST /draw
//   GET  /announcements
//   GET  /entries
//
// SEO:
//   GET /sitemap.xml
//   GET /robots.txt
//
// WEBSITE:
//   All other GET/HEAD requests are served from GitHub Pages.
//
// REQUIRED:
//   D1 binding: LOTTERY_DB
//   Secret: ADMIN_KEY
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/" +
  "sarvamsabarigireesha/sarvam-sabarigireesha/" +
  "refs/heads/main";

const GITHUB_PAGES_HOST =
  "sarvamsabarigireesha.github.io";

const GITHUB_PAGES_PATH =
  "/sarvam-sabarigireesha";


// ============================================================
// WORKER
// ============================================================

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    // --------------------------------------------------------
    // CORS
    // --------------------------------------------------------

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods":
        "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, X-Admin-Key",
    };


    // ========================================================
    // CORS PREFLIGHT
    // ========================================================

    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: cors,
      });

    }


    // ========================================================
    // SEO — SITEMAP.XML
    // ========================================================

    if (
      url.pathname === "/sitemap.xml" &&
      (
        request.method === "GET" ||
        request.method === "HEAD"
      )
    ) {

      const sitemapUrl =
        `${GITHUB_RAW_BASE}/sitemap.xml`;

      try {

        const response =
          await fetch(sitemapUrl, {
            cf: {
              cacheTtl: 3600,
              cacheEverything: true,
            },
          });


        if (!response.ok) {

          return new Response(
            "Sitemap temporarily unavailable",
            {
              status: 503,
              headers: {
                "Content-Type":
                  "text/plain; charset=UTF-8",
                "Cache-Control":
                  "no-cache",
              },
            }
          );

        }


        const body =
          await response.text();


        // IMPORTANT:
        // Do NOT send X-Robots-Tag: noindex
        // on sitemap.xml.

        return new Response(
          request.method === "HEAD"
            ? null
            : body,
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/xml; charset=UTF-8",

              "Cache-Control":
                "public, max-age=3600",

              "Access-Control-Allow-Origin":
                "*",
            },
          }
        );


      } catch (error) {

        return new Response(
          "Sitemap temporarily unavailable",
          {
            status: 503,
            headers: {
              "Content-Type":
                "text/plain; charset=UTF-8",
            },
          }
        );

      }

    }


    // ========================================================
    // SEO — ROBOTS.TXT
    // ========================================================

    if (
      url.pathname === "/robots.txt" &&
      (
        request.method === "GET" ||
        request.method === "HEAD"
      )
    ) {

      const robotsUrl =
        `${GITHUB_RAW_BASE}/robots.txt`;

      try {

        const response =
          await fetch(robotsUrl, {
            cf: {
              cacheTtl: 3600,
              cacheEverything: true,
            },
          });


        if (!response.ok) {

          const fallbackRobots =
            `User-agent: *
Allow: /

Sitemap: https://www.sarvamsabarigireesha.com/sitemap.xml
`;

          return new Response(
            request.method === "HEAD"
              ? null
              : fallbackRobots,
            {
              status: 200,
              headers: {
                "Content-Type":
                  "text/plain; charset=UTF-8",

                "Cache-Control":
                  "public, max-age=3600",
              },
            }
          );

        }


        let body =
          await response.text();


        // Make sure robots.txt contains
        // the correct sitemap URL.

        if (
          !body.includes(
            "https://www.sarvamsabarigireesha.com/sitemap.xml"
          )
        ) {

          body =
            body.trim() +
            "\n\nSitemap: https://www.sarvamsabarigireesha.com/sitemap.xml\n";

        }


        return new Response(
          request.method === "HEAD"
            ? null
            : body,
          {
            status: 200,
            headers: {
              "Content-Type":
                "text/plain; charset=UTF-8",

              "Cache-Control":
                "public, max-age=3600",
            },
          }
        );


      } catch (error) {

        const fallbackRobots =
          `User-agent: *
Allow: /

Sitemap: https://www.sarvamsabarigireesha.com/sitemap.xml
`;

        return new Response(
          request.method === "HEAD"
            ? null
            : fallbackRobots,
          {
            status: 200,
            headers: {
              "Content-Type":
                "text/plain; charset=UTF-8",
            },
          }
        );

      }

    }


    // ========================================================
    // API — DEVOTEE REGISTRATION
    // ========================================================

    if (
      url.pathname === "/register" &&
      request.method === "POST"
    ) {

      try {

        const body =
          await request.json();


        const {
          name,
          phone,
          address,
          donation,
        } = body;


        if (
          !name ||
          !phone ||
          !address
        ) {

          return json(
            {
              error:
                "name, phone and address are required",
            },
            400,
            cors
          );

        }


        await env.LOTTERY_DB
          .prepare(
            `INSERT INTO entries
             (
               name,
               phone,
               address,
               donation,
               created_at,
               cycle_status
             )
             VALUES (?, ?, ?, ?, ?, 'pending')`
          )
          .bind(
            name,
            phone,
            address,
            donation || null,
            new Date().toISOString()
          )
          .run();


        return json(
          {
            ok: true,
          },
          200,
          cors
        );


      } catch (error) {

        return json(
          {
            error:
              "Invalid request",
          },
          400,
          cors
        );

      }

    }


    // ========================================================
    // API — ADMIN DRAW
    // ========================================================

    if (
      url.pathname === "/draw" &&
      request.method === "POST"
    ) {

      const adminKey =
        request.headers.get(
          "X-Admin-Key"
        );


      if (
        !env.ADMIN_KEY ||
        adminKey !== env.ADMIN_KEY
      ) {

        return json(
          {
            error:
              "unauthorized",
          },
          401,
          cors
        );

      }


      try {

        const body =
          await request
            .json()
            .catch(() => ({}));


        const winnerCount =
          Number(
            body.winnerCount || 1
          );


        const count =
          Math.max(
            1,
            Math.min(
              winnerCount,
              50
            )
          );


        const {
          results: pending,
        } =
          await env.LOTTERY_DB
            .prepare(
              `SELECT
                 id,
                 name,
                 phone,
                 address
               FROM entries
               WHERE cycle_status = 'pending'`
            )
            .all();


        if (
          !pending ||
          pending.length === 0
        ) {

          return json(
            {
              error:
                "no pending entries",
            },
            400,
            cors
          );

        }


        // ----------------------------------------------------
        // Random winner selection
        // ----------------------------------------------------

        const shuffled =
          pending.sort(
            () =>
              Math.random() - 0.5
          );


        const winners =
          shuffled.slice(
            0,
            count
          );


        // ----------------------------------------------------
        // Mark winners
        // ----------------------------------------------------

        for (
          const winner
          of winners
        ) {

          await env.LOTTERY_DB
            .prepare(
              `UPDATE entries
               SET
                 cycle_status = 'won',
                 won_at = ?
               WHERE id = ?`
            )
            .bind(
              new Date().toISOString(),
              winner.id
            )
            .run();

        }


        // ----------------------------------------------------
        // Public announcement
        // ----------------------------------------------------

        const firstNames =
          winners
            .map(
              (winner) =>
                (winner.name || "")
                  .trim()
                  .split(/\s+/)[0]
            )
            .join(", ");


        const title =
          `Prasadam Lottery Result — ` +
          `${winners.length} devotee` +
          `${
            winners.length > 1
              ? "s"
              : ""
          } selected`;


        const announcementBody =
          `This round's Prasadam has been ` +
          `allotted to: ${firstNames}. ` +
          `Selected devotees have been ` +
          `notified directly and Prasadam ` +
          `will be shipped to them shortly. ` +
          `Swamiye Saranam Ayyappa.`;


        await env.LOTTERY_DB
          .prepare(
            `INSERT INTO announcements
             (
               title,
               body,
               created_at
             )
             VALUES (?, ?, ?)`
          )
          .bind(
            title,
            announcementBody,
            new Date().toISOString()
          )
          .run();


        return json(
          {
            ok: true,
            winners,
          },
          200,
          cors
        );


      } catch (error) {

        return json(
          {
            error:
              "Draw failed",
          },
          500,
          cors
        );

      }

    }


    // ========================================================
    // API — PUBLIC ANNOUNCEMENTS
    // ========================================================

    if (
      url.pathname === "/announcements" &&
      request.method === "GET"
    ) {

      try {

        const {
          results,
        } =
          await env.LOTTERY_DB
            .prepare(
              `SELECT
                 title,
                 body,
                 created_at
               FROM announcements
               ORDER BY created_at DESC
               LIMIT 10`
            )
            .all();


        return json(
          {
            announcements:
              results || [],
          },
          200,
          cors
        );


      } catch (error) {

        return json(
          {
            error:
              "Unable to load announcements",
          },
          500,
          cors
        );

      }

    }


    // ========================================================
    // API — ADMIN ENTRIES
    // ========================================================

    if (
      url.pathname === "/entries" &&
      request.method === "GET"
    ) {

      const adminKey =
        request.headers.get(
          "X-Admin-Key"
        );


      if (
        !env.ADMIN_KEY ||
        adminKey !== env.ADMIN_KEY
      ) {

        return json(
          {
            error:
              "unauthorized",
          },
          401,
          cors
        );

      }


      try {

        const {
          results,
        } =
          await env.LOTTERY_DB
            .prepare(
              `SELECT
                 id,
                 name,
                 phone,
                 cycle_status,
                 created_at
               FROM entries
               ORDER BY created_at DESC`
            )
            .all();


        return json(
          {
            entries:
              results || [],
          },
          200,
          cors
        );


      } catch (error) {

        return json(
          {
            error:
              "Unable to load entries",
          },
          500,
          cors
        );

      }

    }


    // ========================================================
    // WEBSITE FALLBACK — GITHUB PAGES
    // ========================================================
    //
    // Custom domain:
    // https://www.sarvamsabarigireesha.com
    //
    // GitHub Pages:
    // https://sarvamsabarigireesha.github.io/
    //      sarvam-sabarigireesha/
    //
    // Example:
    //
    // /about
    // ->
    // /sarvam-sabarigireesha/about
    //
    // /gallery
    // ->
    // /sarvam-sabarigireesha/gallery
    //
    // /assets/file.css
    // ->
    // /sarvam-sabarigireesha/assets/file.css
    // ========================================================

    if (
      request.method === "GET" ||
      request.method === "HEAD"
    ) {

      const githubUrl =
        new URL(
          `https://${GITHUB_PAGES_HOST}`
        );


      // IMPORTANT:
      // pathname must contain ONLY the path.
      // Do NOT put the full https:// URL here.

      githubUrl.pathname =
        `${GITHUB_PAGES_PATH}${url.pathname}`;


      githubUrl.search =
        url.search;


      const githubRequest =
        new Request(
          githubUrl.toString(),
          {
            method:
              request.method,

            headers:
              request.headers,
          }
        );


      const response =
        await fetch(
          githubRequest
        );


      const headers =
        new Headers(
          response.headers
        );


      headers.set(
        "X-Served-By",
        "Cloudflare-Worker-GitHub-Pages"
      );


      // ----------------------------------------------------
      // Cache static assets
      // ----------------------------------------------------

      if (
        url.pathname.startsWith(
          "/assets/"
        )
      ) {

        headers.set(
          "Cache-Control",
          "public, max-age=86400"
        );

      }


      return new Response(
        response.body,
        {
          status:
            response.status,

          statusText:
            response.statusText,

          headers,
        }
      );

    }


    // ========================================================
    // 404
    // ========================================================

    return json(
      {
        error:
          "not found",
      },
      404,
      cors
    );

  },

};


// ============================================================
// JSON RESPONSE HELPER
// ============================================================

function json(
  obj,
  status = 200,
  cors = {}
) {

  return new Response(
    JSON.stringify(obj),
    {
      status,

      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",

        ...cors,
      },
    }
  );

}
