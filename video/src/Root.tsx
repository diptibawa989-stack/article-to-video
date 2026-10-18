import React from 'react';
import {Composition} from 'remotion';
import {Essay} from './Essay';
import sample from './sample.json';
import {FPS, totalFrames} from './timing';
import type {Storyboard} from './types';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Essay"
    component={Essay as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={300}
    defaultProps={sample as unknown as Record<string, unknown>}
    calculateMetadata={({props}) => ({durationInFrames: totalFrames(props as unknown as Storyboard)})}
  />
);
