// Checks a storyboard, then renders it with Remotion.
// Usage:
//   node scripts/render.mjs storyboards/<slug>.json            -> out/<slug>.mp4
//   node scripts/render.mjs storyboards/<slug>.json --preview  -> out/<slug>-preview/*.png (one still per scene)
//   node scripts/render.mjs storyboards/<slug>.json --check    -> validate only
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {icons} from 'lucide-react';
import {p, readJson, writeJson} from './lib.mjs';
import {sceneKeys, slots} from '../video/src/timing-core.mjs';

const file = process.argv[2];
const preview = process.argv.includes('--preview');
const checkOnly = process.argv.includes('--check');
if (!file) { console.error('Usage: node scripts/render.mjs storyboards/<slug>.json [--preview|--check]'); process.exit(1); }
const abs = path.resolve(file);
const slug = path.basename(abs, '.json');
const sb = readJson(abs, null);
if (!sb) { console.error(`Could not read ${file} as JSON.`); process.exit(1); }

// ---- validation: keeps every scene readable on a phone ----
const errs = [];
const str = (v, name, max, min = 1) => {
  if (typeof v !== 'string' || v.trim().length < min) errs.push(`${name} is missing`);
  else if (v.length > max) errs.push(`${name} is ${v.length} chars, max ${max}: "${v}"`);
};
const arr = (v, name, min, max, eachMax) => {
  if (!Array.isArray(v) || v.length < min || v.length > max) { errs.push(`${name} needs ${min}-${max} items`); return; }
  v.forEach((x, i) => str(x, `${name}[${i}]`, eachMax));
};
const num = (v, name, lo, hi) => { if (typeof v !== 'number' || Number.isNaN(v) || v < lo || v > hi) errs.push(`${name} must be a number from ${lo} to ${hi}`); };
const iconName = (s) => String(s || '').trim().replace(/(^|[-_\s]+)([a-z0-9])/gi, (_, __, c) => c.toUpperCase());

str(sb.title, 'title', 110); if (sb.author) str(sb.author, 'author', 60); str(sb.publication, 'publication', 60); str(sb.url, 'url', 300);
str(sb.hook, 'hook', 140); str(sb.thesis, 'thesis', 180); str(sb.mapCenter, 'mapCenter', 28); str(sb.takeaway, 'takeaway', 180);
if (sb.whyPicked) str(sb.whyPicked, 'whyPicked', 90);
if (sb.topics) arr(sb.topics, 'topics', 1, 3, 20);
if (!Array.isArray(sb.ideas) || sb.ideas.length < 3 || sb.ideas.length > 6) errs.push('ideas needs 3-6 items');
let quotes = 0;
(sb.ideas || []).forEach((idea, i) => {
  const n = `ideas[${i}]`;
  str(idea.label, `${n}.label`, 26); str(idea.headline, `${n}.headline`, 70); str(idea.body, `${n}.body`, 170);
  if (idea.icon && !icons[iconName(idea.icon)]) {
    const word = iconName(idea.icon).replace(/\d+$/, '').match(/[A-Z][a-z]+/g)?.[0] || '';
    const near = Object.keys(icons).filter((k) => word && k.includes(word)).slice(0, 6);
    errs.push(`${n}.icon "${idea.icon}" is not a Lucide icon.${near.length ? ` Try: ${near.join(', ')}` : ' Pick one from lucide.dev/icons'}`);
  }
  const v = idea.visual || {};
  const at = `${n}.visual`;
  switch (v.type) {
    case 'flow': arr(v.steps, `${at}.steps`, 2, 5, 40); break;
    case 'contrast':
      str(v.left?.label, `${at}.left.label`, 18); str(v.right?.label, `${at}.right.label`, 18);
      arr(v.left?.points, `${at}.left.points`, 1, 3, 40); arr(v.right?.points, `${at}.right.points`, 1, 3, 40); break;
    case 'stat': str(v.value, `${at}.value`, 8); str(v.label, `${at}.label`, 80); break;
    case 'list': arr(v.items, `${at}.items`, 2, 5, 50); break;
    case 'cycle': arr(v.nodes, `${at}.nodes`, 3, 5, 22); break;
    case 'quote': quotes++; str(v.text, `${at}.text`, 160); break;
    case 'timeline':
      if (!Array.isArray(v.events) || v.events.length < 2 || v.events.length > 5) errs.push(`${at}.events needs 2-5 items`);
      else v.events.forEach((e, j) => { str(e?.when, `${at}.events[${j}].when`, 16); str(e?.what, `${at}.events[${j}].what`, 44); });
      break;
    case 'matrix':
      arr(v.xAxis, `${at}.xAxis`, 2, 2, 16); arr(v.yAxis, `${at}.yAxis`, 2, 2, 16); arr(v.quadrants, `${at}.quadrants`, 4, 4, 30);
      if (v.highlight !== undefined) num(v.highlight, `${at}.highlight`, 0, 3);
      break;
    case 'funnel': arr(v.stages, `${at}.stages`, 3, 5, 28); break;
    case 'iceberg': arr(v.above, `${at}.above`, 1, 3, 30); arr(v.below, `${at}.below`, 2, 4, 30); break;
    case 'spectrum': str(v.left, `${at}.left`, 18); str(v.right, `${at}.right`, 18); num(v.marker, `${at}.marker`, 0, 100); str(v.markerLabel, `${at}.markerLabel`, 28); break;
    case 'venn': str(v.left, `${at}.left`, 20); str(v.right, `${at}.right`, 20); str(v.overlap, `${at}.overlap`, 24); break;
    case 'bars':
      if (!Array.isArray(v.items) || v.items.length < 2 || v.items.length > 5) errs.push(`${at}.items needs 2-5 items`);
      else v.items.forEach((x, j) => { str(x?.label, `${at}.items[${j}].label`, 24); num(x?.value, `${at}.items[${j}].value`, 0, 1e12); });
      if (v.unit) str(v.unit, `${at}.unit`, 6);
      break;
    default: errs.push(`${at}.type must be one of: flow, contrast, stat, list, cycle, quote, timeline, matrix, funnel, iceberg, spectrum, venn, bars`);
  }
});
if (quotes > 1) errs.push(`Only one quote visual per video (found ${quotes}). Paraphrase the rest.`);
const types = (sb.ideas || []).map((x) => x.visual?.type);
types.forEach((t, i) => { if (i && t === types[i - 1]) errs.push(`ideas[${i - 1}] and ideas[${i}] both use "${t}". Vary the visuals.`); });

// narration (optional): spoken script per scene, used by scripts/voice.mjs
const maxWords = {intro: 30, hook: 30, thesis: 40, map: 40, takeaway: 45, outro: 25};
if (sb.narration) {
  const keys = sb.ideas ? sceneKeys(sb) : [];
  for (const [k, t] of Object.entries(sb.narration)) {
    if (!keys.includes(k)) { errs.push(`narration.${k} is not a scene (use: ${keys.join(', ')})`); continue; }
    const w = String(t).trim().split(/\s+/).filter(Boolean).length;
    const lim = maxWords[k] ?? 60;
    if (w > lim) errs.push(`narration.${k} is ${w} words, max ${lim}. Tighten it.`);
  }
}
if (errs.length) { console.error('Storyboard needs fixes:\n- ' + errs.join('\n- ')); process.exit(1); }
if (checkOnly) { console.log('Storyboard OK'); process.exit(0); }

// ---- merge voiceover, if scripts/voice.mjs made one ----
const voiceFile = p('storyboards', `${slug}.voice.json`);
const voice = readJson(voiceFile, null);
const props = {...sb};
if (voice) {
  const live = Object.fromEntries(Object.entries(voice.clips || {}).filter(([k, c]) => sb.narration?.[k] && c.text === String(sb.narration[k]).trim() && fs.existsSync(p('public', c.src))));
  props.voice = Object.fromEntries(Object.entries(live).map(([k, c]) => [k, {src: c.src, sec: c.sec}]));
  const stale = Object.keys(sb.narration || {}).filter((k) => !live[k]);
  if (stale.length) console.warn(`Voiceover is out of date for: ${stale.join(', ')}. Run: node scripts/voice.mjs ${file}`);
  else console.log(`Using voiceover (${Object.keys(live).length} clips).`);
} else if (sb.narration) {
  console.log('No voiceover yet (silent video). To add one: node scripts/voice.mjs ' + file);
}
const propsFile = p('out', `.props-${slug}.json`);
writeJson(propsFile, props);

// ---- render ----
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
const run = (args) => {
  const r = spawnSync('npx', ['remotion', ...args, ...browser, '--log=error'], {cwd: p(), stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (preview) {
  const dir = p('out', `${slug}-preview`);
  fs.rmSync(dir, {recursive: true, force: true});
  fs.mkdirSync(dir, {recursive: true});
  let start = 0;
  for (const s of slots(props)) {
    const frame = start + Math.round(s.frames * 0.8); // late in the scene, once everything has animated in
    run(['still', 'video/src/index.ts', 'Essay', path.join(dir, `${String(start).padStart(5, '0')}-${s.key}.png`), `--props=${propsFile}`, `--frame=${frame}`]);
    start += s.frames;
  }
  console.log(`Preview stills → out/${slug}-preview/`);
} else {
  const out = p('out', `${slug}.mp4`);
  run(['render', 'video/src/index.ts', 'Essay', out, `--props=${propsFile}`]);
  const secs = Math.round(slots(props).reduce((a, s) => a + s.frames, 0) / 30);
  console.log(`Video → out/${slug}.mp4 (${secs}s)`);
}
