// Shared by the video (timing.ts) and the scripts, so scene lengths always match.
export const FPS = 30;
export const VOICE_LEAD_SEC = 0.4; // narration starts this long after a scene appears
const VOICE_TAIL_SEC = 0.8; // breathing room after narration ends

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

const visualWords = (v) => {
  switch (v.type) {
    case 'flow': return words(v.steps.join(' '));
    case 'contrast': return words([v.left.label, ...v.left.points, v.right.label, ...v.right.points].join(' '));
    case 'stat': return words(v.value + ' ' + v.label);
    case 'list': return words(v.items.join(' '));
    case 'cycle': return words(v.nodes.join(' '));
    case 'quote': return words(v.text);
    case 'timeline': return words(v.events.map((e) => e.when + ' ' + e.what).join(' '));
    case 'matrix': return words([...v.xAxis, ...v.yAxis, ...v.quadrants].join(' '));
    case 'funnel': return words(v.stages.join(' '));
    case 'iceberg': return words([...v.above, ...v.below].join(' '));
    case 'spectrum': return words([v.left, v.right, v.markerLabel].join(' '));
    case 'venn': return words([v.left, v.right, v.overlap].join(' '));
    case 'bars': return words(v.items.map((x) => x.label).join(' ')) + v.items.length;
    default: return 0;
  }
};

// ~0.32s per word on screen, plus time for the animation to land
const readSec = (w, min) => Math.max(min, 2.4 + w * 0.32);

export const sceneKeys = (sb) => ['intro', 'hook', 'thesis', ...sb.ideas.map((_, i) => `idea${i}`), 'map', 'takeaway', 'outro'];

export const slots = (sb) => {
  const n = sb.ideas.length;
  const list = [
    {key: 'intro', label: 'THE READ', sec: 5},
    {key: 'hook', label: 'THE QUESTION', sec: readSec(words(sb.hook), 4.5)},
    {key: 'thesis', label: 'THE BIG IDEA', sec: readSec(words(sb.thesis), 5.5)},
    ...sb.ideas.map((idea, i) => ({
      key: `idea${i}`,
      label: `IDEA ${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`,
      sec: readSec(words(idea.headline) + words(idea.body) + visualWords(idea.visual), 7),
    })),
    {key: 'map', label: 'THE MAP', sec: 8},
    {key: 'takeaway', label: 'SO WHAT', sec: readSec(words(sb.takeaway), 5.5)},
    {key: 'outro', label: 'READ IT', sec: 4.5},
  ];
  return list.map((s) => {
    const v = sb.voice?.[s.key];
    const sec = v ? Math.max(s.sec, VOICE_LEAD_SEC + v.sec + VOICE_TAIL_SEC) : s.sec;
    return {key: s.key, label: s.label, frames: Math.round(sec * FPS)};
  });
};

export const totalFrames = (sb) => slots(sb).reduce((a, s) => a + s.frames, 0);
