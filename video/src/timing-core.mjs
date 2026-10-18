// Shared by the video (timing.ts) and scripts/render.mjs, so scene lengths always match.
export const FPS = 30;

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

const visualWords = (v) => {
  switch (v.type) {
    case 'flow': return words(v.steps.join(' '));
    case 'contrast': return words([v.left.label, ...v.left.points, v.right.label, ...v.right.points].join(' '));
    case 'stat': return words(v.value + ' ' + v.label);
    case 'list': return words(v.items.join(' '));
    case 'cycle': return words(v.nodes.join(' '));
    case 'quote': return words(v.text);
    default: return 0;
  }
};

// ~0.32s per word on screen, plus time for the animation to land
const readSec = (w, min) => Math.max(min, 2.4 + w * 0.32);

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
  return list.map((s) => ({key: s.key, label: s.label, frames: Math.round(s.sec * FPS)}));
};

export const totalFrames = (sb) => slots(sb).reduce((a, s) => a + s.frames, 0);
