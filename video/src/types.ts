export type Visual =
  | {type: 'flow'; steps: string[]}
  | {type: 'contrast'; left: {label: string; points: string[]}; right: {label: string; points: string[]}}
  | {type: 'stat'; value: string; label: string}
  | {type: 'list'; items: string[]}
  | {type: 'cycle'; nodes: string[]}
  | {type: 'quote'; text: string};

export type Idea = {
  label: string; // 1-4 words, used on the map
  headline: string;
  body: string;
  visual: Visual;
};

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
};
