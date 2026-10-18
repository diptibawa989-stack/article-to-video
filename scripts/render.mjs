// Checks a storyboard, then renders it with Remotion.
// Usage:
//   node scripts/render.mjs storyboards/<slug>.json            -> out/<slug>.mp4
//   node scripts/render.mjs storyboards/<slug>.json --preview  -> out/<slug>-preview/*.png (one still per scene)
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {p, readJson} from './lib.mjs';
import {slots} from '../video/src/timing-core.mjs';

const file = process.argv[2];
const preview = process.argv.includes('--preview');
if (!file) { console.error('Usage: node scripts/render.mjs storyboards/<slug>.json [--preview]'); process.exit(1); }
const abs = path.resolve(file);
const sb = readJson(abs, null);
if (!sb) { console.error(`Could not read ${file} as JSON.`); process.exit(1); }

// ---- validation: keeps every scene readable on a phone ----
const errs = [];
const str = (v, name, max, min = 1) => {
  if (typeof v !== 'string' || v.trim().length < min) errs.push(`${name} is missing`);
  else if (v.length > max) errs.push(`${name} is ${v.length} chars, max ${max}: "${v}"`);
};
const arr = (v, name, min, max, each, eachMax) => {
  if (!Array.isArray(v) || v.length < min || v.length > max) { errs.push(`${name} needs ${min}-${max} items`); return; }
  v.forEach((x, i) => str(x, `${name}[${i}]`, eachMax));
};
str(sb.title, 'title', 110); if (sb.author) str(sb.author, 'author', 60); str(sb.publication, 'publication', 60); str(sb.url, 'url', 300);
str(sb.hook, 'hook', 140); str(sb.thesis, 'thesis', 180); str(sb.mapCenter, 'mapCenter', 28); str(sb.takeaway, 'takeaway', 180);
if (sb.whyPicked) str(sb.whyPicked, 'whyPicked', 90);
if (sb.topics) arr(sb.topics, 'topics', 1, 3, null, 20);
if (!Array.isArray(sb.ideas) || sb.ideas.length < 3 || sb.ideas.length > 6) errs.push('ideas needs 3-6 items');
let quotes = 0;
(sb.ideas || []).forEach((idea, i) => {
  const n = `ideas[${i}]`;
  str(idea.label, `${n}.label`, 26); str(idea.headline, `${n}.headline`, 70); str(idea.body, `${n}.body`, 170);
  const v = idea.visual || {};
  switch (v.type) {
    case 'flow': arr(v.steps, `${n}.visual.steps`, 2, 5, null, 40); break;
    case 'contrast':
      str(v.left?.label, `${n}.visual.left.label`, 18); str(v.right?.label, `${n}.visual.right.label`, 18);
      arr(v.left?.points, `${n}.visual.left.points`, 1, 3, null, 40); arr(v.right?.points, `${n}.visual.right.points`, 1, 3, null, 40); break;
    case 'stat': str(v.value, `${n}.visual.value`, 8); str(v.label, `${n}.visual.label`, 80); break;
    case 'list': arr(v.items, `${n}.visual.items`, 2, 5, null, 50); break;
    case 'cycle': arr(v.nodes, `${n}.visual.nodes`, 3, 5, null, 22); break;
    case 'quote': quotes++; str(v.text, `${n}.visual.text`, 160); break;
    default: errs.push(`${n}.visual.type must be flow | contrast | stat | list | cycle | quote`);
  }
});
if (quotes > 1) errs.push(`Only one quote visual per video (found ${quotes}). Paraphrase the rest.`);
const types = (sb.ideas || []).map((x) => x.visual?.type);
types.forEach((t, i) => { if (i && t === types[i - 1]) errs.push(`ideas[${i - 1}] and ideas[${i}] both use "${t}". Vary the visuals.`); });
if (errs.length) { console.error('Storyboard needs fixes:\n- ' + errs.join('\n- ')); process.exit(1); }

// ---- render ----
const slug = path.basename(abs, '.json');
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
const run = (args) => {
  const r = spawnSync('npx', ['remotion', ...args, ...browser, '--log=error'], {cwd: p(), stdio: 'inherit'});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (preview) {
  const dir = p('out', `${slug}-preview`);
  fs.mkdirSync(dir, {recursive: true});
  let start = 0;
  for (const s of slots(sb)) {
    const frame = start + Math.round(s.frames * 0.8); // late in the scene, once everything has animated in
    run(['still', 'video/src/index.ts', 'Essay', path.join(dir, `${String(start).padStart(5, '0')}-${s.key}.png`), `--props=${abs}`, `--frame=${frame}`]);
    start += s.frames;
  }
  console.log(`Preview stills → out/${slug}-preview/`);
} else {
  const out = p('out', `${slug}.mp4`);
  run(['render', 'video/src/index.ts', 'Essay', out, `--props=${abs}`]);
  const secs = Math.round(slots(sb).reduce((a, s) => a + s.frames, 0) / 30);
  console.log(`Video → out/${slug}.mp4 (${secs}s)`);
}
