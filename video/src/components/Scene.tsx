import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, PAD} from '../theme';

// Glitch-in, slow camera drift, fade out
export const Scene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const f = useCurrentFrame();
  const fade = interpolate(f, [0, 8, dur - 10, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flicker = f === 3 || f === 6 ? 0.35 : 1;
  const zoom = 1 + 0.03 * (f / dur);
  const drift = -10 * (f / dur);
  const g = f < 8 ? (8 - f) * 1.6 : 0;
  const jitter = f < 8 ? (f % 2 === 0 ? 1 : -1) * g * 0.8 : 0;
  return (
    <AbsoluteFill
      style={{
        opacity: fade * flicker,
        padding: `200px ${PAD}px 230px`,
        display: 'flex',
        flexDirection: 'column',
        transform: `translate(${jitter}px, ${drift}px) scale(${zoom})`,
        filter: g ? `drop-shadow(${g}px 0 0 ${C.pink}aa) drop-shadow(${-g}px 0 0 ${C.cyan}aa)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
