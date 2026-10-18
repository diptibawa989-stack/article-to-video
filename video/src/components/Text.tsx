import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, MONO, SANS, glow} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Kicker: React.FC<{text: string; color: string; delay?: number}> = ({text, color, delay = 0}) => {
  const f = useCurrentFrame() - delay;
  const chars = Math.floor(interpolate(f, [0, 18], [0, text.length], clamp));
  return (
    <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 6, color, textShadow: glow(color, 0.6), minHeight: 40}}>
      {text.slice(0, chars)}
      <span style={{opacity: f % 16 < 8 ? 1 : 0}}>▌</span>
    </div>
  );
};

// Headline that powers on like a neon tube
export const Neon: React.FC<{text: string; color: string; size: number; delay?: number; weight?: number; align?: 'left' | 'center'}> = ({
  text, color, size, delay = 0, weight = 700, align = 'left',
}) => {
  const f = useCurrentFrame() - delay;
  const on = interpolate(f, [0, 4, 5, 8, 9, 14], [0, 0.9, 0.2, 1, 0.6, 1], clamp);
  const lift = interpolate(f, [0, 14], [24, 0], clamp);
  return (
    <div style={{fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: 1.08, letterSpacing: -1, color: C.text, textShadow: glow(color, 0.9), opacity: on, transform: `translateY(${lift}px)`, textAlign: align}}>
      {text}
    </div>
  );
};

// Words arrive one after another
export const Words: React.FC<{text: string; size: number; color?: string; delay?: number; perWord?: number; align?: 'left' | 'center'}> = ({
  text, size, color = C.dim, delay = 0, perWord = 2.2, align = 'left',
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const words = text.split(/\s+/);
  return (
    <div style={{fontFamily: SANS, fontWeight: 500, fontSize: size, lineHeight: 1.3, color, textAlign: align}}>
      {words.map((w, i) => {
        const s = spring({frame: f - delay - i * perWord, fps, config: {damping: 200}, durationInFrames: 12});
        return (
          <span key={i} style={{display: 'inline-block', opacity: s, transform: `translateY(${(1 - s) * 18}px)`, marginRight: '0.27em'}}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Line: React.FC<{color: string; delay?: number; width?: number | string}> = ({color, delay = 0, width = '100%'}) => {
  const f = useCurrentFrame() - delay;
  const p = interpolate(f, [0, 20], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  return <div style={{height: 4, width, transform: `scaleX(${p})`, transformOrigin: 'left', background: color, boxShadow: glow(color, 0.8), borderRadius: 2}} />;
};
