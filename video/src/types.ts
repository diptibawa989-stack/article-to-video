export type Visual =
  | {type: 'flow'; steps: string[]}
  | {type: 'contrast'; left: {label: string; points: string[]}; right: {label: string; points: string[]}}
  | {type: 'stat'; value: string; label: string}
  | {type: 'list'; items: string[]}
  | {type: 'cycle'; nodes: string[]}
  | {type: 'quote'; text: string}
  | {type: 'timeline'; events: {when: string; what: string}[]}
  | {type: 'matrix'; xAxis: [string, string]; yAxis: [string, string]; quadrants: [string, string, string, string]; highlight?: number}
  | {type: 'funnel'; stages: string[]}
  | {type: 'iceberg'; above: string[]; below: string[]}
  | {type: 'spectrum'; left: string; right: string; marker: number; markerLabel: string}
  | {type: 'venn'; left: string; right: string; overlap: string}
  | {type: 'bars'; items: {label: string; value: number}[]; unit?: string};

export type Idea = {
  label: string; // 1-4 words, used on the map
  headline: string;
  body: string;
  icon?: string; // lucide icon name, e.g. "Rocket" or "trending-up"
  visual: Visual;
};

export type VoiceClip = {src: string; sec: number};

export type Storyboard = {
  title: string;
  author?: string;
  publication: string; // site or publication name
  url: string;
  readMinutes?: number;
  topics?: string[];
  whyPicked?: string;
  hook: string;
  thesis: string;
  mapCenter: string; // 1-4 words: the thesis as a label
  ideas: Idea[];
  takeaway: string;
  narration?: Record<string, string>; // scene key -> spoken script
  voice?: Record<string, VoiceClip>; // filled in by scripts/voice.mjs
};
