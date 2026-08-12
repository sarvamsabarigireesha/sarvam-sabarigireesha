# Sarvam Sabarigireesha — Setup Guide

## Files ఇందులో ఏముంది
- `index.html` — పూర్తి website (single file, direct Cloudflare Pages కి upload చేయచ్చు). Top-right లో language switcher ఉంది — English, తెలుగు, हिंदी, മലയാളം, ಕನ್ನಡ, தமிழ் — 6 భాషలు.
- `worker.js` — Prasadam Lottery backend (Cloudflare Worker)
- `schema.sql` — Lottery database structure (Cloudflare D1)

---

## Part 1: Website ని GitHub + Cloudflare Pages కి పెట్టడం (Free)

1. GitHub లో కొత్త repository create చేయండి (e.g. `sarvamsabarigireesha-site`).
2. ఈ `index.html` ఫైల్ ని repo లోకి upload చేయండి (GitHub website లోనే "Add file → Upload files" వాడొచ్చు).
3. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → మీ repo select చేయండి.
4. Build settings: Framework preset = **None**, Build command = ఖాళీ గా వదిలేయండి, Output directory = `/`.
5. Deploy నొక్కండి — 1-2 నిమిషాల్లో `xxxx.pages.dev` URL వస్తుంది.
6. మీ domain connect చేయడానికి: Pages project → **Custom domains → Add domain** → `sarvamsabarigireesha.com` టైప్ చేయండి. Cloudflare ఇచ్చే DNS records automatic గా add అవుతాయి (domain Cloudflare లోనే ఉంటే).

ఇది అయ్యాక Emergent bill ఆపేసుకోవచ్చు — website పూర్తిగా Cloudflare Pages మీద free గా run అవుతుంది.

---

## Part 2: Prasadam Lottery backend (Cloudflare Worker + D1)

1. Cloudflare dashboard → **Workers & Pages → Create → Worker** → పేరు పెట్టండి (e.g. `prasadam-lottery`).
2. `worker.js` content ని అందులో paste చేయండి, Deploy చేయండి.
3. **Workers & Pages → D1 → Create database** → పేరు `LOTTERY_DB`. అందులో "Console" tab తీసుకుని `schema.sql` content run చేయండి (table create అవుతుంది).
4. మీ Worker → **Settings → Bindings → Add D1 database binding** → Variable name: `LOTTERY_DB`, Database: మీరు create చేసిన database select చేయండి.
5. Worker → **Settings → Variables → Add secret** → Name: `ADMIN_KEY`, Value: మీకు నచ్చిన strong password (ఇది draw trigger చేయడానికి కావాలి, ఎవరికీ చెప్పకండి).
6. Save చేసాక Worker URL వస్తుంది (e.g. `https://prasadam-lottery.yourname.workers.dev`).
7. `index.html` లో చివర్లో ఉన్న ఈ లైన్:
   ```
   const WORKER_URL = "REPLACE_WITH_YOUR_WORKER_URL/register";
   ```
   దాన్ని మీ actual Worker URL తో మార్చండి (e.g. `https://prasadam-lottery.yourname.workers.dev/register`), తర్వాత GitHub లో ఫైల్ update చేయండి — Cloudflare Pages automatic గా redeploy అవుతుంది.

### Prasadam available అయినప్పుడు draw ఎలా trigger చేయాలి
Prasadam స్టాక్ ready అయినప్పుడు, ఈ command (terminal/Postman/browser extension నుండి) run చేయండి:

```
curl -X POST https://prasadam-lottery.yourname.workers.dev/draw \
  -H "X-Admin-Key: మీ-ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"winnerCount": 5}'
```

`winnerCount` — ఎంతమంది winners కావాలో అంత సంఖ్య పెట్టండి (ఎంత prasadam packets available అయితే అంత). Response లో winners పేర్లు, phone, address వస్తాయి — వాటికి మీరు courier/notify చేయవచ్చు. ఎంచుకోబడని వారు automatic గా next cycle కి pending లో ఉంటారు.

*(ఇది manual command trigger. మీరు కోరుకుంటే, దీన్ని ఒక సింపుల్ admin బటన్ page గా కూడా చేయించుకోవచ్చు — అడగండి.)*

---

## Part 3: Social Media Automation (Free tools)

పూర్తి automatic posting కి Instagram/Facebook API access మీ account తో మీరే set చేయాలి (ఇది నేను directly చేయలేను, account login కావాలి). Free గా ఇవి వాడొచ్చు:

- **Meta Business Suite** (business.facebook.com) — Facebook + Instagram రెండింటికీ post scheduling, పూర్తి free.
- **Buffer Free plan** — 3 channels వరకు free scheduling, easy interface.

Content (photos/text) ఒక్కసారి schedule చేస్తే, ఆ tools automatic గా set time కి post చేస్తాయి — మీరు రోజూ touch చేయాల్సిన అవసరం లేదు.

---

## తర్వాత ఏమి చేయాలి
- `index.html` లో placeholder photos, updates, social links — మీ actual content తో replace చేయండి.
- Temple timings, festival dates — Updates section లో edit చేయండి.
