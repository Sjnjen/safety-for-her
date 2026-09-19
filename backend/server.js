/**
 * Safe For Her SA — backend
 * --------------------------------------------------------------
 * Plain Node + Express, no build step. Two jobs:
 *   1. Store & serve community incident reports (the live map data)
 *   2. Proxy a real news API server-side, so the secret API key
 *      never has to live in browser JavaScript
 *
 * Deploy this next to your existing Node apps on your VPS
 * (e.g. behind Nginx + PM2, same pattern as your other bots).
 *
 * Setup:
 *   1. npm install
 *   2. cp .env.example .env   and fill in the values
 *   3. node server.js         (or: pm2 start server.js --name sfhs-api)
 * -------------------------------------------------------------- */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*'; // set to your real domain in production
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;       // required to verify/remove reports
const NEWS_API_KEY = process.env.NEWS_API_KEY || null;     // from your news provider (e.g. gnews.io)
const NEWS_CACHE_MS = 10 * 60 * 1000; // refetch upstream news at most every 10 minutes

const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(REPORTS_FILE)) fs.writeFileSync(REPORTS_FILE, '[]');

const app = express();
app.use(express.json({ limit: '256kb' }));
app.use(cors({ origin: ALLOWED_ORIGIN }));

/* ------------------------------------------------------------------
   Simple serialized file store (fine for MVP traffic). If this grows
   past a few thousand reports or you need concurrent-write safety
   under real load, swap this for SQLite/Postgres — the route logic
   below won't need to change much.
------------------------------------------------------------------ */
let writeQueue = Promise.resolve();
function readReports() {
  try { return JSON.parse(fs.readFileSync(REPORTS_FILE, 'utf8')); }
  catch (e) { return []; }
}
function writeReports(reports) {
  writeQueue = writeQueue.then(() =>
    fs.promises.writeFile(REPORTS_FILE, JSON.stringify(reports, null, 2))
  );
  return writeQueue;
}

/* Round to a coarse grid (~1.1km) so no exact address is ever stored. */
function coarsen(lat, lng) {
  const factor = 100;
  return [Math.round(lat * factor) / factor, Math.round(lng * factor) / factor];
}

const ALLOWED_TYPES = ['assault', 'harassment', 'domestic', 'stalking', 'child-safety', 'other'];

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ error: 'admin_not_configured' });
  const auth = req.headers.authorization || '';
  if (auth !== `Bearer ${ADMIN_TOKEN}`) return res.status(401).json({ error: 'unauthorized' });
  next();
}

/* ------------------------------------------------------------------
   REPORTS
------------------------------------------------------------------ */

// Public: list active (non-removed) reports for the map.
// Deliberately returns only fields the map needs — never raw request
// metadata like IP address, and never anything beyond the approximate
// location the client already coarsened (we coarsen again here too,
// in case a client is modified to skip it).
app.get('/api/reports', (req, res) => {
  const reports = readReports()
    .filter(r => !r.removed)
    .map(r => ({
      id: r.id,
      type: r.type,
      area: r.area,
      lat: r.lat,
      lng: r.lng,
      verified: !!r.verified,
      childInvolved: !!r.childInvolved,
      createdAt: r.createdAt
    }));
  res.json({ reports });
});

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8, // 8 submissions per IP per 15 minutes — generous for a real user, blunt against spam/abuse
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many reports submitted. Please try again later, or call 10111 if this is urgent.' }
});

// Public: submit a new report.
app.post('/api/reports', reportLimiter, (req, res) => {
  const b = req.body || {};
  const type = ALLOWED_TYPES.includes(b.type) ? b.type : null;
  const area = typeof b.area === 'string' ? b.area.slice(0, 200) : '';
  const description = typeof b.description === 'string' ? b.description.slice(0, 2000) : '';
  const lat = Number(b.lat), lng = Number(b.lng);

  if (!type || !area || !description || !isFinite(lat) || !isFinite(lng)) {
    return res.status(400).json({ error: 'invalid_report' });
  }
  // South Africa bounding box (rough) — reject wildly out-of-range coordinates.
  if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
    return res.status(400).json({ error: 'location_out_of_range' });
  }

  const [clat, clng] = coarsen(lat, lng);
  const report = {
    id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    type, area, description,
    anonymous: b.anonymous !== false,
    childInvolved: !!b.childInvolved,
    emergency: !!b.emergency,
    verified: false,
    removed: false,
    lat: clat, lng: clng,
    createdAt: Date.now(),
    // Not exposed by GET /api/reports — kept only for abuse review by an admin.
    _submittedIp: req.ip
  };

  const reports = readReports();
  reports.push(report);
  writeReports(reports)
    .then(() => res.status(201).json({ ok: true, id: report.id }))
    .catch(() => res.status(500).json({ error: 'storage_failed' }));
});

// Admin: mark a report verified/unverified, or remove it. Protect this route
// (ADMIN_TOKEN in .env) — never expose it to the public frontend.
app.patch('/api/reports/:id', requireAdmin, (req, res) => {
  const reports = readReports();
  const r = reports.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'not_found' });
  if (typeof req.body.verified === 'boolean') r.verified = req.body.verified;
  if (typeof req.body.removed === 'boolean') r.removed = req.body.removed;
  writeReports(reports)
    .then(() => res.json({ ok: true }))
    .catch(() => res.status(500).json({ error: 'storage_failed' }));
});

/* ------------------------------------------------------------------
   NEWS PROXY
   Swap the fetch URL below for whichever provider you sign up with.
   This example uses GNews.io's search endpoint, which has a free tier
   usable in production (with rate limits) — see gnews.io/pricing.
------------------------------------------------------------------ */
let newsCache = { items: [], fetchedAt: 0 };

const GBV_QUERY = '(gender-based violence OR femicide OR domestic violence OR child abuse OR "violence against women") AND South Africa';

async function fetchNewsFromProvider() {
  if (!NEWS_API_KEY) return [];
  const url = 'https://gnews.io/api/v4/search'
    + '?q=' + encodeURIComponent(GBV_QUERY)
    + '&lang=en&country=za&max=10&apikey=' + NEWS_API_KEY;

  const res = await fetch(url);
  if (!res.ok) throw new Error('news_provider_error_' + res.status);
  const data = await res.json();

  return (data.articles || []).map(a => ({
    id: 'n_' + Buffer.from(a.url || a.title).toString('base64').slice(0, 16),
    tag: 'alert', // classify further here if your provider gives categories
    title: a.title,
    excerpt: a.description || '',
    date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '',
    source: (a.source && a.source.name) || 'News'
  }));
}

app.get('/api/news', async (req, res) => {
  const now = Date.now();
  if (now - newsCache.fetchedAt < NEWS_CACHE_MS && newsCache.items.length) {
    return res.json({ items: newsCache.items });
  }
  try {
    const items = await fetchNewsFromProvider();
    if (items.length) newsCache = { items, fetchedAt: now };
    res.json({ items: newsCache.items });
  } catch (e) {
    // Serve the last good cache rather than an error, if we have one.
    if (newsCache.items.length) return res.json({ items: newsCache.items, stale: true });
    res.status(502).json({ error: 'news_unavailable' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Safe For Her SA API listening on :${PORT}`));
