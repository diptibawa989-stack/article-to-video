import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {PAD} from '../theme';

// Fade + neon flicker in, fade out
export const Scene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8, dur - 10, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flicker = f === 3 || f === 6 ? 0.35 : 1;
  return (
    <AbsoluteFill style={{opacity: fade * flicker, padding: `200px ${PAD}px 230px`, display: 'flex', flexDirection: 'column'}}>
      {children}
    </AbsoluteFill>
  );
};
