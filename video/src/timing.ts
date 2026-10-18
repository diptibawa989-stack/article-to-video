import type {Storyboard} from './types';
// @ts-ignore plain JS module shared with the scripts
import * as core from './timing-core.mjs';

export type Slot = {key: string; label: string; frames: number};

export const FPS: number = core.FPS;
export const VOICE_LEAD_SEC: number = core.VOICE_LEAD_SEC;
export const slots = (sb: Storyboard): Slot[] => core.slots(sb);
export const totalFrames = (sb: Storyboard): number => core.totalFrames(sb);
