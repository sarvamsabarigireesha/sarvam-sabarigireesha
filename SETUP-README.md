# Sarvam Sabarigireesha (Thathwamasi) — Professional Site Package

## మార్పులు ఈ round లో
1. **Tabs తగ్గించాను**: Community, Reels, Videos తీసేశాను. ఇప్పుడు nav: Home, About, Darshan Timings, Announcements, Prasadam, Pilgrimage, Gallery, Calendar, Contact.
2. **Tone**: పూర్తిగా poetic/cinematic copy తీసేసి, TTD-style official/informational tone (అన్ని 6 భాషల్లో) — English, Telugu, Hindi, Malayalam, Kannada, Tamil.
3. **Dashboard quick-links**: direct గా పని చేసేలా ఉన్నాయి — click చేస్తే ఆ section కి నేరుగా వెళ్తుంది (Darshan Timings, Prasadam, Calendar, Announcements, Gallery, Contact).
4. **Branding**: Header లో "THATHWAMASI — The Digital Home of Sarvam Sabarigireesha" — మీ calendar.html లో already unna brand తోనే match అయ్యేలా చేశాను.
5. **Logo**: `index.html` లో `assets/logo.jpg` అని reference పెట్టాను — మీ repo లో ఆ path లో logo ఫైల్ ఉంటే అదే వాడుకుంటుంది. ఇంకా లేకపోతే, ఒక logo file ఇవ్వండి, నేను `assets/logo.jpg` గా save చేసి పెడతాను.
6. **Prasadam Lottery** — పూర్తి system ready:
   - `index.html` లో registration form (name, phone, address, optional donation)
   - `worker.js` — Cloudflare Worker backend (free registration save చేస్తుంది)
   - `schema.sql` — Cloudflare D1 database structure
   - Admin (మీరు) prasadam అందుబాటులో ఉన్నప్పుడు `/draw` endpoint ని ఒక్కసారి call చేస్తే, random winners select అయ్యి, వెంటనే వారి పేరు/phone/address మీకు కనిపిస్తుంది — notify చేయడానికి.

## ⚠️ ముఖ్యమైన హెచ్చరిక — Photos గురించి
మీ ప్రస్తుత `index.html` లో photos `customer-assets-39nsmqrw.emergentagent.net` (Emergent CDN) నుండి load అవుతున్నాయి. **Emergent subscription cancel చేస్తే ఈ image links break అయ్యే అవకాశం ఉంది.** దీన్ని పరిష్కరించడానికి:
1. ఆ photos ని download చేసుకోండి
2. మీ GitHub repo లో `assets/` folder లో పెట్టండి
3. `index.html` లో image `src` లను `https://customer-assets-...` నుండి `assets/photo-name.jpg` కి మార్చండి

నేను చెప్తే ఈ మార్పు కూడా చేసి పెడతాను — photos ని ఇక్కడికి upload చేయండి.

## Deploy Steps (GitHub → Cloudflare Pages)
1. ఈ 4 files ని మీ repo (`sarvamsabarigireesha/sarvam-sabarigireesha`) root లో replace చేయండి: `index.html`, `calendar.html`
2. `worker.js` + `schema.sql` ని ప్రత్యేక Cloudflare Worker గా deploy చేయండి:
   ```
   wrangler d1 create lottery-db
   wrangler d1 execute lottery-db --file=schema.sql
   wrangler secret put ADMIN_KEY
   wrangler deploy worker.js
   ```
3. Worker deploy అయ్యాక వచ్చిన URL ని `index.html` చివర్లో ఉన్న `WORKER_URL` variable లో పేస్ట్ చేయండి, repo లో update చేయండి.
4. Cloudflare Pages already connected కాబట్టి, push చేయగానే auto-deploy అవుతుంది.

## కొత్తగా జోడించినవి (ఈ round)
1. **Winner Auto-Announcement**: మీరు `/draw` call చేసినప్పుడు, worker ఇప్పుడు automatic గా ఒక public announcement కూడా create చేస్తుంది (only first names + count, full address/phone మీకు మాత్రమే privately). ఇది website లో Announcements section లో వెంటనే కనిపిస్తుంది — మీరు మళ్ళీ site లో ఏమీ edit చేయాల్సిన అవసరం లేదు.
2. **Floating Social Icons**: Facebook, Instagram, YouTube, WhatsApp icons ఇప్పుడు screen scroll చేసినా ఎడమవైపు స్థిరంగా (sticky) కనిపిస్తాయి — మీరు పంపిన reference screenshot లాగానే.
3. `index.html` చివర్లో `ANNOUNCEMENTS_URL` అనే రెండో variable కూడా ఉంది — worker deploy చేసాక దాన్ని కూడా (మీ `WORKER_URL` లాగే) మీ real worker URL తో replace చేయండి, అప్పుడు announcements auto-load అవుతాయి.

## Prasadam draw చేయడం ఎలా (prasadam ready అయినప్పుడు)
```
curl -X POST https://<your-worker-url>/draw \
  -H "X-Admin-Key: <your admin key>" \
  -H "Content-Type: application/json" \
  -d '{"winnerCount": 5}'
```
ఇది వెంటనే 5 మంది winners ని (పేరు, phone, address తో) return చేస్తుంది — వారికి prasadam పంపడానికి.
