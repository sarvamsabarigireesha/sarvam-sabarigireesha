# Sarvam Sabarigireesha (Thathwamasi) — How this site works

Live: https://www.sarvamsabarigireesha.com
Hosting: **Cloudflare Workers + static assets**. Every push to `main` deploys automatically.

## Files

| Path | What it is |
|---|---|
| `index.html` | Home page (all sections, 6 languages, calendar, prasadam form) |
| `about/ calendar/ prasadam/ journey/ gallery/ community/ contact/` | Copies of the home page with their own title / description / H1. **Any change to shared code must be made in all 8 files.** |
| `pilgrimage/ makaravilakku/ mandala-pooja/ ayyappa-vratham/ travel-guide/` | Stand-alone SEO guide pages |
| `assets/*.webp` | Images used by the pages (WebP, ≤1200 px) |
| `assets/*.jpg / *.jpeg` | Originals — `ayyappa-hero.jpg` is the social-share (og:image) picture, `logo.jpg` is used in structured data |
| `worker.js` | Cloudflare Worker: non-www/http → `https://www` (301), `/about` → `/about/` (301), inline `/sitemap.xml`, custom 404, security headers, 7-day cache for `/assets/` |
| `wrangler.jsonc` | Worker config (runs worker first, then static assets) |
| `sw.js` | PWA service worker. **Bump `CACHE = 'thathwamasi-vNN'` on every deploy** that changes assets |
| `manifest.json`, `favicon.ico`, `assets/icon-*.png` | App icons |
| `sitemap.xml` / `robots.txt` | SEO. Note: the sitemap that is actually served lives inside `worker.js` — keep both in sync |
| `.assetsignore` | Keeps `worker.js`, `wrangler.jsonc`, this README etc. from being published |

## Prasadam registration (Google Apps Script)

The form posts to the Apps Script URL in `APPS_SCRIPT_URL` (inside every HTML page).
Winners are loaded from `APPS_SCRIPT_URL?action=winners`.

**The Apps Script deployment must have “Who has access: Anyone”** (Deploy → Manage deployments → Edit → New version).
If it is set to “Only myself” or “Anyone with a Google account”, every registration fails with “Connection error”.
Check with: `curl -sL '<APPS_SCRIPT_URL>?action=winners'` — it must print JSON, not a Google sign-in page.

Privacy: the winners endpoint should return **first name + city only**. The site masks mobile numbers
(`98xxxxxx10`) as a safety net, but full numbers should never be sent to the browser.

## Changing images

Cloudflare tells browsers to cache `/assets/` for 7 days. When you replace a picture, **upload it under a new
file name** (e.g. `ayyappa-hero-v2.webp`) and update the references, otherwise returning visitors keep the old one.
Convert new photos to WebP and keep them ≤1200 px on the long side (≈100 KB each).

## Little Ayyappa cursor companion

`assets/ayyappa-buddy.js` + `assets/buddy/ayyappa-{walka,passa,walkb,passb,stand,bless,sit}.webp` (≈90 KB total).
Included at the end of every page: `<script src="/assets/ayyappa-buddy.js?v=3" defer></script>`.

- Walks after the mouse with a **real 4-frame walk cycle** (stride A → passing → stride B → passing)
  played at footfall rate, so the legs genuinely alternate (same idea as the qtology.in Little Ganesha).
  On top of the frames: per-step bob & sway, landing squash / airborne stretch, lean into the run,
  bigger little hops going up/down, and a soft **spring follow** (gentle overshoot & settle instead of
  sliding like a sticker). Step rate scales with speed: slow baby steps → hurried bounding strides.
- The 4 walk frames were generated as one matched set (AI, referenced from the original walk pose) and
  are all 110×220 px, feet-aligned and tone-matched — keep it that way if you ever swap a frame.
  `assets/buddy/ayyappa-walk.webp` (the original single walk pose) is kept for reference only.
- Then stands → blesses with a "Swamiye Sharanam Ayyappa" bubble (in the selected language) → sits &
  waves when idle. Hops when you click. Never blocks clicks.
- Desktop/laptop only (hidden on phones/tablets) and hidden for users who turn on "reduce motion".
- Blessing/waving poses are never mirrored, so Swamy always blesses with the right hand.
- Size: edit `POSES` at the top of the JS. Text: edit `SAY`. Step feel: `K`, `DAMP`, `VMAX`, `stepHz`, `amp` in `tick()`.
- After changing the JS, bump `?v=3` → `?v=4` in all 13 pages so browsers fetch the new file.
- To remove: delete that one `<script>` line from the pages.
