import type {Storyboard} from './types';
// @ts-ignore plain JS module shared with scripts/render.mjs
import * as core from './timing-core.mjs';

export type Slot = {key: string; label: string; frames: number};

export const FPS: number = core.FPS;
export const slots = (sb: Storyboard): Slot[] => core.slots(sb);
export const totalFrames = (sb: Storyboard): number => core.totalFrames(sb);
