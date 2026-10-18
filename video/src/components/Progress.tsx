import React from 'react';
import {useCurrentFrame} from 'remotion';
import {C, MONO, PAD, glow} from '../theme';
import type {Slot} from '../timing';

export const Progress: React.FC<{slots: Slot[]; title: string}> = ({slots, title}) => {
  const f = useCurrentFrame();
  let start = 0;
  let current = slots[0];
  for (const s of slots) {
    if (f >= start && f < start + s.frames) current = s;
    start += s.frames;
  }
  const total = start;
  return (
    <div style={{position: 'absolute', top: 90, left: PAD, right: PAD}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.dim, marginBottom: 14}}>
        <span style={{maxWidth: 640, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}}>{title.toUpperCase()}</span>
        <span>{current.label}</span>
      </div>
      <div style={{height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2}}>
        <div style={{height: 3, width: `${Math.min(100, (f / total) * 100)}%`, background: C.cyan, boxShadow: glow(C.cyan, 0.6), borderRadius: 2}} />
      </div>
    </div>
  );
};
