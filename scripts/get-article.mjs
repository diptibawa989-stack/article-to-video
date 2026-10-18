// Saves any article as clean text for Claude to read.
// Usage:
//   node scripts/get-article.mjs <url>
//   node scripts/get-article.mjs <url> --file article.txt   (use text you copied yourself, e.g. for pages that block downloads)
import fs from 'node:fs';
import {Readability} from '@mozilla/readability';
import {parseHTML} from 'linkedom';
import {get, htmlToText, p, parseFeed, slugify, wordCount} from './lib.mjs';

const args = process.argv.slice(2);
const url = args.find((a) => /^https?:\/\//.test(a));
const fileIdx = args.indexOf('--file');
const localFile = fileIdx >= 0 ? args[fileIdx + 1] : null;
if (!url && !localFile) {
  console.error('Usage: node scripts/get-article.mjs <url> [--file copied-text.txt]');
  process.exit(1);
}
const u = url ? new URL(url) : null;

const fail = (msg) => {
  console.error(msg);
  console.error('\nWorkaround: open the article in your browser, copy all the text into a file (e.g. article.txt), then run:');
  console.error(`  node scripts/get-article.mjs ${url || '<url>'} --file article.txt`);
  process.exit(3);
};

// Substack posts have a clean JSON API, use it when available
async function trySubstack() {
  const slug = (u.pathname.match(/\/p\/([^/?#]+)/) || [])[1];
  if (!slug) return null;
  try {
    const post = await get(`${u.origin}/api/v1/posts/${slug}`);
    if (!post?.body_html && !post?.audience) return null;
    if (post.audience && post.audience !== 'everyone') {
      console.error(`PAYWALLED: "${post.title}" is for paid subscribers only. Skipping.`);
      process.exit(2);
    }
    const by = post.publishedBylines?.[0];
    return {
      slug,
      meta: {title: post.title, author: by?.name || '', publication: by?.publicationUsers?.[0]?.publication?.name || u.host, url: post.canonical_url || url, date: post.post_date || ''},
      text: htmlToText(post.body_html || ''),
    };
  } catch {
    return null;
  }
}

const metaTag = (doc, ...names) => {
  for (const n of names) {
    const el = doc.querySelector(`meta[property="${n}"], meta[name="${n}"]`);
    if (el?.getAttribute('content')) return el.getAttribute('content').trim();
  }
  return '';
};

async function tryWebPage() {
  let html;
  try {
    html = await get(url, {json: false, timeout: 25000});
  } catch (e) {
    fail(`Could not download the page (${e.message}).`);
  }
  const {document} = parseHTML(html);
  const meta = {
    title: metaTag(document, 'og:title', 'twitter:title') || document.title || '',
    author: metaTag(document, 'author', 'article:author', 'parsely-author', 'twitter:creator'),
    publication: metaTag(document, 'og:site_name', 'application-name') || u.host.replace(/^www\./, ''),
    url: metaTag(document, 'og:url') || url,
    date: metaTag(document, 'article:published_time', 'date', 'pubdate'),
  };
  const art = new Readability(document, {charThreshold: 300}).parse();
  if (!art) fail('Could not find the article text on this page.');
  if (art.title) meta.title = meta.title || art.title;
  if (art.byline && !meta.author) meta.author = art.byline.replace(/^by\s+/i, '').trim();
  if (art.siteName) meta.publication = art.siteName;
  if (/^https?:\/\//.test(meta.author)) meta.author = '';
  let text = htmlToText(art.content || '');
  // Some sites ship the full text only in their feed
  if (wordCount(text) < 300) {
    try {
      const feed = await get(`${u.origin}/feed`, {json: false});
      const item = parseFeed(feed).find((x) => x.url && x.url.split('?')[0].replace(/\/$/, '') === url.split('?')[0].replace(/\/$/, ''));
      if (item?.html && wordCount(htmlToText(item.html)) > wordCount(text)) text = htmlToText(item.html);
    } catch {}
  }
  const last = u.pathname.split('/').filter(Boolean).pop() || u.host;
  return {slug: slugify(last.replace(/\.(html?|php|aspx?)$/i, '')), meta, text};
}

let result;
if (localFile) {
  const raw = fs.readFileSync(localFile, 'utf8');
  const text = /<\/?(p|div|h\d)[\s>]/i.test(raw) ? htmlToText(raw) : raw.trim();
  const last = u ? u.pathname.split('/').filter(Boolean).pop() || u.host : localFile.replace(/\.\w+$/, '');
  result = {slug: slugify(last), meta: {title: '', author: '', publication: u ? u.host.replace(/^www\./, '') : '', url: url || '', date: ''}, text};
} else {
  result = (await trySubstack()) || (await tryWebPage());
}

const words = wordCount(result.text);
if (words < 250) fail(`Only ${words} words came through. The page may be paywalled, behind a login, or built with JavaScript.`);

const file = p('articles', `${result.slug}.md`);
fs.mkdirSync(p('articles'), {recursive: true});
const front = Object.entries({...result.meta, slug: result.slug, words}).map(([k, v]) => `${k}: ${JSON.stringify(v ?? '')}`).join('\n');
fs.writeFileSync(file, `---\n${front}\n---\n\n${result.text}\n`);
console.log(`Saved articles/${result.slug}.md (${words} words)`);
if (!result.meta.title) console.log('Note: no title found. Take it from the text, or ask the user.');
