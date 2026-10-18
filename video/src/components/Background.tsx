import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {C} from '../theme';

export const Background: React.FC = () => {
  const f = useCurrentFrame();
  const cell = 96;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse 120% 70% at 50% 18%, ${C.deep} 0%, ${C.bg} 62%)`}}>
      {/* synthwave floor */}
      <div style={{position: 'absolute', left: -800, right: -800, bottom: -260, height: 980, perspective: 520, overflow: 'hidden', opacity: 0.6}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateX(64deg)',
            transformOrigin: '50% 100%',
            backgroundImage: `linear-gradient(${C.pink} 2px, transparent 2px), linear-gradient(90deg, ${C.pink} 2px, transparent 2px)`,
            backgroundSize: `${cell}px ${cell}px`,
            backgroundPosition: `0px ${(f * 2.2) % cell}px`,
            WebkitMaskImage: 'linear-gradient(to top, black 25%, transparent 92%)',
            maskImage: 'linear-gradient(to top, black 25%, transparent 92%)',
          }}
        />
      </div>
      {/* horizon glow */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 690, height: 3, background: C.pink, boxShadow: `0 0 30px 8px ${C.pink}66`, opacity: 0.35}} />
      {/* scanlines + vignette */}
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, transparent 2px 5px)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)'}} />
    </AbsoluteFill>
  );
};
