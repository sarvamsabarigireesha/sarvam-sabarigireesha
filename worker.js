// Cloudflare Worker — Prasadam Lottery backend
// ----------------------------------------------------
// Backend:
//   POST /register
//   POST /draw
//   GET  /announcements
//   GET  /entries
//
// Website fallback:
//   All GET/HEAD requests that are not API endpoints
//   are served from the GitHub Pages site.
//
// Required bindings:
//   D1 database binding: LOTTERY_DB
//   Secret: ADMIN_KEY
// ----------------------------------------------------

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    };

    // --------------------------------------------------
    // CORS preflight
    // --------------------------------------------------
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors,
      });
    }

    // ==================================================
    // API: Devotee registration
    // ==================================================
    if (url.pathname === "/register" && request.method === "POST") {
      try {
        const body = await request.json();

        const {
          name,
          phone,
          address,
          donation,
        } = body;

        if (!name || !phone || !address) {
          return json(
            {
              error: "name, phone and address are required",
            },
            400,
            cors
          );
        }

        await env.LOTTERY_DB.prepare(
          `INSERT INTO entries
           (name, phone, address, donation, created_at, cycle_status)
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
            error: "Invalid request",
          },
          400,
          cors
        );
      }
    }

    // ==================================================
    // API: Admin draw
    // ==================================================
    if (url.pathname === "/draw" && request.method === "POST") {
      const adminKey = request.headers.get("X-Admin-Key");

      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json(
          {
            error: "unauthorized",
          },
          401,
          cors
        );
      }

      try {
        const body = await request.json().catch(() => ({}));

        const winnerCount = Number(body.winnerCount || 1);

        const count = Math.max(
          1,
          Math.min(winnerCount, 50)
        );

        const { results: pending } =
          await env.LOTTERY_DB.prepare(
            `SELECT id, name, phone, address
             FROM entries
             WHERE cycle_status = 'pending'`
          ).all();

        if (!pending || pending.length === 0) {
          return json(
            {
              error: "no pending entries",
            },
            400,
            cors
          );
        }

        // Randomize entries
        const shuffled = pending.sort(
          () => Math.random() - 0.5
        );

        const winners = shuffled.slice(0, count);

        // Mark winners
        for (const winner of winners) {
          await env.LOTTERY_DB.prepare(
            `UPDATE entries
             SET cycle_status = 'won',
                 won_at = ?
             WHERE id = ?`
          )
            .bind(
              new Date().toISOString(),
              winner.id
            )
            .run();
        }

        // Create public announcement
        const firstNames = winners
          .map((winner) => {
            return (winner.name || "")
              .trim()
              .split(/\s+/)[0];
          })
          .join(", ");

        const title =
          `Prasadam Lottery Result — ` +
          `${winners.length} devotee` +
          `${winners.length > 1 ? "s" : ""} selected`;

        const announcementBody =
          `This round's Prasadam has been allotted to: ` +
          `${firstNames}. Selected devotees have been notified ` +
          `directly and Prasadam will be shipped to them shortly. ` +
          `Swamiye Saranam Ayyappa.`;

        await env.LOTTERY_DB.prepare(
          `INSERT INTO announcements
           (title, body, created_at)
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
            error: "Draw failed",
          },
          500,
          cors
        );
      }
    }

    // ==================================================
    // API: Public announcements
    // ==================================================
    if (
      url.pathname === "/announcements" &&
      request.method === "GET"
    ) {
      try {
        const { results } =
          await env.LOTTERY_DB.prepare(
            `SELECT title, body, created_at
             FROM announcements
             ORDER BY created_at DESC
             LIMIT 10`
          ).all();

        return json(
          {
            announcements: results || [],
          },
          200,
          cors
        );
      } catch (error) {
        return json(
          {
            error: "Unable to load announcements",
          },
          500,
          cors
        );
      }
    }

    // ==================================================
    // API: Admin entries
    // ==================================================
    if (
      url.pathname === "/entries" &&
      request.method === "GET"
    ) {
      const adminKey = request.headers.get("X-Admin-Key");

      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json(
          {
            error: "unauthorized",
          },
          401,
          cors
        );
      }

      try {
        const { results } =
          await env.LOTTERY_DB.prepare(
            `SELECT
               id,
               name,
               phone,
               cycle_status,
               created_at
             FROM entries
             ORDER BY created_at DESC`
          ).all();

        return json(
          {
            entries: results || [],
          },
          200,
          cors
        );
      } catch (error) {
        return json(
          {
            error: "Unable to load entries",
          },
          500,
          cors
        );
      }
    }

    // ==================================================
    // WEBSITE FALLBACK
    // ==================================================
    //
    // Cloudflare Worker is connected to:
    // www.sarvamsabarigireesha.com
    //
    // GitHub Pages actual site:
    // sarvamsabarigireesha.github.io/
    //   sarvam-sabarigireesha/
    //
    // Therefore:
    //
    // /sitemap.xml
    //      ↓
    // /sarvam-sabarigireesha/sitemap.xml
    //
    // /robots.txt
    //      ↓
    // /sarvam-sabarigireesha/robots.txt
    //
    // /about
    //      ↓
    // /sarvam-sabarigireesha/about
    // ==================================================

    if (
      request.method === "GET" ||
      request.method === "HEAD"
    ) {
      const githubUrl = new URL(request.url);

      githubUrl.hostname =
        "sarvamsabarigireesha.github.io";

      githubUrl.protocol = "https:";

      githubUrl.pathname =
        `/sarvam-sabarigireesha${url.pathname}`;

      // Keep query parameters
      githubUrl.search = url.search;

      const githubRequest = new Request(
        githubUrl.toString(),
        {
          method: request.method,
          headers: request.headers,
        }
      );

      const response = await fetch(githubRequest);

      // Add useful cache headers for static website files
      const headers = new Headers(
        response.headers
      );

      headers.set(
        "X-Served-By",
        "Cloudflare-Worker-GitHub-Pages"
      );

      // Cache static assets/sitemap/robots
      if (
        url.pathname === "/sitemap.xml" ||
        url.pathname === "/robots.txt" ||
        url.pathname.startsWith("/assets/")
      ) {
        headers.set(
          "Cache-Control",
          "public, max-age=3600"
        );
      }

      return new Response(
        response.body,
        {
          status: response.status,
          statusText: response.statusText,
          headers,
        }
      );
    }

    // ==================================================
    // Everything else
    // ==================================================
    return json(
      {
        error: "not found",
      },
      404,
      cors
    );
  },
};

// ======================================================
// JSON helper
// ======================================================

function json(obj, status = 200, cors = {}) {
  return new Response(
    JSON.stringify(obj),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        ...cors,
      },
    }
  );
}
