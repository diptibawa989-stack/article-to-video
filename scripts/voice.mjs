// Voices the storyboard's narration with ElevenLabs, one clip per scene.
// Usage: node scripts/voice.mjs storyboards/<slug>.json
// Needs ELEVENLABS_API_KEY in a .env file in the project root (see .env.example).
// Clips are cached: only scenes whose narration changed are re-voiced.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {p, readJson, settings, writeJson} from './lib.mjs';
import {sceneKeys} from '../video/src/timing-core.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/voice.mjs storyboards/<slug>.json'); process.exit(1); }
const abs = path.resolve(file);
const slug = path.basename(abs, '.json');
const sb = readJson(abs, null);
if (!sb) { console.error(`Could not read ${file}.`); process.exit(1); }
if (!sb.narration || !Object.keys(sb.narration).length) { console.error('This storyboard has no "narration". Add one first (see CLAUDE.md).'); process.exit(1); }

// tiny .env reader, no extra dependency
const env = {...process.env};
if (fs.existsSync(p('.env'))) {
  for (const line of fs.readFileSync(p('.env'), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const key = env.ELEVENLABS_API_KEY;
if (!key) {
  console.error('No ElevenLabs key found. Create a file called .env in the project folder containing:\n  ELEVENLABS_API_KEY=your_key_here\nGet a key at elevenlabs.io (Profile → API Keys). The video still renders without a voice.');
  process.exit(4);
}

const cfg = settings().voice || {};
if (cfg.enabled === false) { console.log('Voiceover is turned off in config/settings.json.'); process.exit(0); }
const voiceId = cfg.voiceId || '21m00Tcm4TlvDq8ikWAM';
const modelId = cfg.modelId || 'eleven_multilingual_v2';

const order = sceneKeys(sb).filter((k) => sb.narration[k]);
const voiceFile = p('storyboards', `${slug}.voice.json`);
const prev = readJson(voiceFile, {clips: {}});
const clips = {};
const dir = p('public', 'voice', slug);
fs.mkdirSync(dir, {recursive: true});

let made = 0, reused = 0, chars = 0;
for (const [i, k] of order.entries()) {
  const text = sb.narration[k].trim();
  const hash = crypto.createHash('sha1').update([voiceId, modelId, text].join('|')).digest('hex').slice(0, 12);
  const src = `voice/${slug}/${k}-${hash}.mp3`;
  const old = prev.clips?.[k];
  if (old && old.hash === hash && fs.existsSync(p('public', old.src))) { clips[k] = old; reused++; continue; }

  let res;
  try {
    res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {'xi-api-key': key, 'Content-Type': 'application/json'},
    body: JSON.stringify({
      text,
      model_id: modelId,
      previous_text: order[i - 1] ? sb.narration[order[i - 1]] : undefined,
      next_text: order[i + 1] ? sb.narration[order[i + 1]] : undefined,
    }),
    });
  } catch (e) {
    console.error(`Could not reach ElevenLabs (${e.cause?.code || e.message}). Check your internet connection and try again.`);
    process.exit(5);
  }
  if (!res.ok) {
    const body = await res.text();
    console.error(`ElevenLabs error for "${k}" (${res.status}): ${body.slice(0, 300)}`);
    if (res.status === 401) console.error('Check that ELEVENLABS_API_KEY in .env is correct.');
    process.exit(5);
  }
  const data = await res.json();
  fs.writeFileSync(p('public', src), Buffer.from(data.audio_base64, 'base64'));
  const ends = data.alignment?.character_end_times_seconds || [];
  const sec = ends.length ? ends[ends.length - 1] : text.split(/\s+/).length / 2.6;
  clips[k] = {src, sec: Math.round(sec * 100) / 100, hash, text};
  made++; chars += text.length;
  console.log(`  ${k}: ${clips[k].sec}s`);
}

writeJson(voiceFile, {voiceId, modelId, clips});
console.log(`Voiceover ready: ${made} new clip(s), ${reused} reused (${chars} characters billed) → storyboards/${slug}.voice.json`);
