import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const p = (...xs) => path.join(ROOT, ...xs);
export const settings = () => JSON.parse(fs.readFileSync(p('config', 'settings.json'), 'utf8'));
export const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; } };
export const writeJson = (f, data) => { fs.mkdirSync(path.dirname(f), {recursive: true}); fs.writeFileSync(f, JSON.stringify(data, null, 2)); };

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

export async function get(url, {json = true, timeout = 15000} = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, {headers: {'User-Agent': UA, Accept: json ? 'application/json' : '*/*'}, signal: ctrl.signal, redirect: 'follow'});
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return json ? await r.json() : await r.text();
  } finally {
    clearTimeout(t);
  }
}

export async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({length: n}, async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx]); } catch (e) { out[idx] = {error: String(e.message || e)}; }
    }
  }));
  return out;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ENT = {amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…'};
export const decode = (s) => s
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);

export function htmlToText(html) {
  return decode(
    html
      .replace(/<(script|style|figure|svg|button|form)[\s\S]*?<\/\1>/gi, '')
      .replace(/<div[^>]*class="[^"]*(subscription-widget|button-wrapper|captioned-image|footnote-anchor)[^"]*"[\s\S]*?<\/div>/gi, '')
      .replace(/<h[1-4][^>]*>/gi, '\n\n## ').replace(/<\/h[1-4]>/gi, '\n\n')
      .replace(/<li[^>]*>/gi, '\n- ').replace(/<blockquote[^>]*>/gi, '\n\n> ')
      .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|blockquote|ul|ol)>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
  ).replace(/[ \t]+/g, ' ').replace(/\n[ \t]+/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export const baseUrl = (pub) => pub.custom_domain ? `https://${pub.custom_domain}` : pub.subdomain ? `https://${pub.subdomain}.substack.com` : pub.base_url;

// RSS 2.0 and Atom
export function parseFeed(xml) {
  const items = [];
  const strip = (x) => (x || '').replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '').trim();
  const tag = (block, t) => {
    const x = block.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${t}>`));
    return x ? strip(x[1]) : '';
  };
  for (const m of xml.matchAll(/<item[\s>]([\s\S]*?)<\/item>/g)) {
    const b = m[1];
    items.push({title: decode(tag(b, 'title')), url: tag(b, 'link'), date: tag(b, 'pubDate') || tag(b, 'dc:date'), description: decode(tag(b, 'description').replace(/<[^>]+>/g, '')).slice(0, 400), html: tag(b, 'content:encoded')});
  }
  for (const m of xml.matchAll(/<entry[\s>]([\s\S]*?)<\/entry>/g)) {
    const b = m[1];
    const link = (b.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/) || b.match(/<link[^>]*href="([^"]+)"/) || [])[1] || '';
    items.push({title: decode(tag(b, 'title')), url: link, date: tag(b, 'published') || tag(b, 'updated'), description: decode(tag(b, 'summary').replace(/<[^>]+>/g, '')).slice(0, 400), html: decode(tag(b, 'content'))});
  }
  return items;
}
export const parseRss = parseFeed;

export const isFeed = (text) => /<rss[\s>]|<feed[\s>]|<rdf:RDF/i.test(text.slice(0, 2000));

export const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').slice(0, 60) || 'article';

export const wordCount = (t) => t.split(/\s+/).filter(Boolean).length;
