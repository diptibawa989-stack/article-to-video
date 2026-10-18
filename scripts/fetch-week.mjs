// Collects recent articles from the sources in config/feeds.txt (and, optionally, your public Substack subscriptions).
// Usage: node scripts/fetch-week.mjs  ->  data/candidates.json
import fs from 'node:fs';
import {baseUrl, get, isFeed, p, parseFeed, pool, readJson, settings, wordCount, writeJson} from './lib.mjs';

const cfg = settings();
const since = Date.now() - cfg.lookbackDays * 864e5;

async function sources() {
  const list = new Map();
  if (cfg.substackHandle) {
    try {
      const prof = await get(`https://substack.com/api/v1/user/${cfg.substackHandle.replace(/^@/, '')}/public_profile`);
      for (const s of prof.subscriptions || []) {
        const pub = s.publication || s;
        const url = baseUrl(pub);
        if (url) list.set(url, {name: pub.name, url});
      }
      console.log(`Substack profile: ${list.size} public subscriptions`);
    } catch (e) {
      console.warn(`Could not read Substack profile "${cfg.substackHandle}" (${e.message}).`);
    }
  }
  const txt = fs.existsSync(p('config', 'feeds.txt')) ? fs.readFileSync(p('config', 'feeds.txt'), 'utf8') : '';
  for (const line of txt.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))) {
    const url = line.replace(/\/+$/, '');
    if (!list.has(url)) list.set(url, {name: new URL(url).host.replace(/^www\./, ''), url});
  }
  return [...list.values()];
}

const recentOnly = (items) => items.filter((x) => !x.date || new Date(x.date).getTime() >= since);

async function fromSubstackApi(src) {
  const posts = await get(`${new URL(src.url).origin}/api/v1/archive?sort=new&limit=12`);
  if (!Array.isArray(posts)) throw new Error('not a Substack');
  return posts
    .filter((x) => x.type === 'newsletter' && x.audience === 'everyone')
    .map((x) => ({source: src.name, title: x.title, summary: x.subtitle || x.description || '', url: x.canonical_url, date: x.post_date, words: x.wordcount, likes: x.reaction_count ?? null, comments: x.comment_count ?? null}));
}

async function fromFeed(src) {
  let text = await get(src.url, {json: false});
  if (!isFeed(text)) {
    // A normal web page: look for the feed it links to, else try common feed paths
    const link = (text.match(/<link[^>]+type="application\/(?:rss|atom)\+xml"[^>]*>/i) || [])[0];
    const href = link && (link.match(/href="([^"]+)"/) || [])[1];
    const tries = [href && new URL(href, src.url).href, `${src.url}/feed`, `${src.url}/rss`, `${src.url}/feed.xml`, `${src.url}/rss.xml`, `${src.url}/atom.xml`].filter(Boolean);
    text = null;
    for (const t of tries) {
      try { const x = await get(t, {json: false}); if (isFeed(x)) { text = x; break; } } catch {}
    }
    if (!text) throw new Error('no RSS/Atom feed found');
  }
  return parseFeed(text).map((x) => ({source: src.name, title: x.title, summary: x.description, url: x.url, date: x.date, words: x.html ? wordCount(x.html.replace(/<[^>]+>/g, ' ')) : null, likes: null, comments: null}));
}

const srcs = await sources();
if (!srcs.length) {
  console.error('No sources yet. Add sites or feeds to config/feeds.txt (or set substackHandle in config/settings.json).');
  process.exit(1);
}
const results = await pool(srcs, 6, async (s) => recentOnly(await fromSubstackApi(s).catch(() => fromFeed(s))));
const made = new Set(readJson(p('data', 'history.json'), []).map((h) => h.url));
const errors = [];
let candidates = [];
results.forEach((r, i) => (Array.isArray(r) ? candidates.push(...r) : errors.push(`${srcs[i].url}: ${r.error}`)));
candidates = candidates
  .filter((c) => c.url && !made.has(c.url))
  .filter((c) => c.words == null || c.words >= cfg.minWords)
  .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

writeJson(p('data', 'candidates.json'), {fetchedAt: new Date().toISOString(), lookbackDays: cfg.lookbackDays, sources: srcs.length, errors, candidates});
console.log(`${candidates.length} recent articles from ${srcs.length} sources → data/candidates.json`);
if (errors.length) console.log(`${errors.length} sources failed (listed in the file).`);
