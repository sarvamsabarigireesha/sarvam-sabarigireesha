// Cloudflare Worker — Prasadam Lottery backend
// Deploy this as a Worker, bind a D1 database named LOTTERY_DB (see schema.sql)
// Set a secret ADMIN_KEY (wrangler secret put ADMIN_KEY) to protect the draw endpoint.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // Devotee registration
    if (url.pathname === "/register" && request.method === "POST") {
      const body = await request.json();
      const { name, phone, address, donation } = body;

      if (!name || !phone || !address) {
        return json({ error: "name, phone and address are required" }, 400, cors);
      }

      await env.LOTTERY_DB.prepare(
        `INSERT INTO entries (name, phone, address, donation, created_at, cycle_status)
         VALUES (?, ?, ?, ?, ?, 'pending')`
      ).bind(name, phone, address, donation || null, new Date().toISOString()).run();

      return json({ ok: true }, 200, cors);
    }

    // Admin: trigger a draw when Prasadam is available.
    // Call this from the browser (with the admin key) or curl, whenever stock is ready.
    if (url.pathname === "/draw" && request.method === "POST") {
      const adminKey = request.headers.get("X-Admin-Key");
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json({ error: "unauthorized" }, 401, cors);
      }

      const { winnerCount } = await request.json().catch(() => ({ winnerCount: 1 }));
      const count = Math.max(1, Math.min(winnerCount || 1, 50));

      const { results: pending } = await env.LOTTERY_DB.prepare(
        `SELECT id, name, phone, address FROM entries WHERE cycle_status = 'pending'`
      ).all();

      if (!pending || pending.length === 0) {
        return json({ error: "no pending entries" }, 400, cors);
      }

      // Random winner selection
      const shuffled = pending.sort(() => Math.random() - 0.5);
      const winners = shuffled.slice(0, count);

      for (const w of winners) {
        await env.LOTTERY_DB.prepare(
          `UPDATE entries SET cycle_status = 'won', won_at = ? WHERE id = ?`
        ).bind(new Date().toISOString(), w.id).run();
      }
      // Everyone else who wasn't picked this round goes back into the pool
      // for the next cycle automatically (they stay 'pending').

      return json({ ok: true, winners }, 200, cors);
    }

    // Admin: list current pending entries (for review before drawing)
    if (url.pathname === "/entries" && request.method === "GET") {
      const adminKey = request.headers.get("X-Admin-Key");
      if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
        return json({ error: "unauthorized" }, 401, cors);
      }
      const { results } = await env.LOTTERY_DB.prepare(
        `SELECT id, name, phone, cycle_status, created_at FROM entries ORDER BY created_at DESC`
      ).all();
      return json({ entries: results }, 200, cors);
    }

    return json({ error: "not found" }, 404, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
