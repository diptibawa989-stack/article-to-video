import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACCENTS, C, MONO, SANS, fit, glow, svgGlow} from '../theme';
import type {Visual} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const W = 900;

const useIn = (delay: number) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping: 18, stiffness: 120}});
};

const Box: React.FC<{color: string; delay: number; children: React.ReactNode; style?: React.CSSProperties}> = ({color, delay, children, style}) => {
  const s = useIn(delay);
  return (
    <div style={{border: `3px solid ${color}`, boxShadow: `${glow(color, 0.5)}, inset 0 0 24px ${color}44`, borderRadius: 22, background: 'rgba(7,5,15,0.72)', padding: '22px 28px', opacity: s, transform: `scale(${0.9 + s * 0.1})`, ...style}}>
      {children}
    </div>
  );
};

const Flow: React.FC<{steps: string[]; color: string; delay: number}> = ({steps, color, delay}) => {
  const f = useCurrentFrame();
  const gap = 16;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: W}}>
      {steps.map((s, i) => {
        const d = delay + i * gap;
        const lineP = interpolate(f, [d + 8, d + 16], [0, 1], clamp);
        const c = i === steps.length - 1 ? C.lime : color;
        return (
          <React.Fragment key={i}>
            <Box color={c} delay={d} style={{width: 760, display: 'flex', alignItems: 'center', gap: 24}}>
              <span style={{fontFamily: MONO, fontSize: 30, color: c, textShadow: glow(c, 0.5)}}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(s, 42, 30, 34), color: C.text}}>{s}</span>
            </Box>
            {i < steps.length - 1 && (
              <div style={{width: 4, height: 54, background: color, boxShadow: glow(color, 0.5), transform: `scaleY(${lineP})`, transformOrigin: 'top'}} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Contrast: React.FC<{v: Extract<Visual, {type: 'contrast'}>; delay: number}> = ({v, delay}) => {
  const vs = useIn(delay + 6);
  const col = (side: {label: string; points: string[]}, color: string, d: number) => (
    <Box color={color} delay={d} style={{width: 410, minHeight: 520}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 3, color, textShadow: glow(color, 0.6), marginBottom: 26}}>{side.label.toUpperCase()}</div>
      {side.points.map((p, i) => (
        <Point key={i} text={p} color={color} delay={d + 10 + i * 8} size={fit(p, 36, 28, 40)} />
      ))}
    </Box>
  );
  return (
    <div style={{position: 'relative', display: 'flex', justifyContent: 'space-between', width: W}}>
      {col(v.left, C.pink, delay)}
      {col(v.right, C.cyan, delay + 8)}
      <div style={{position: 'absolute', left: W / 2 - 46, top: 220, width: 92, height: 92, borderRadius: 46, background: C.bg, border: `3px solid ${C.text}`, boxShadow: glow(C.violet, 0.8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 32, color: C.text, opacity: vs, transform: `scale(${vs})`}}>VS</div>
    </div>
  );
};

const Point: React.FC<{text: string; color: string; delay: number; size: number}> = ({text, color, delay, size}) => {
  const s = useIn(delay);
  return (
    <div style={{display: 'flex', gap: 18, marginBottom: 22, opacity: s, transform: `translateX(${(1 - s) * 30}px)`}}>
      <div style={{flex: 'none', width: 16, height: 16, marginTop: size * 0.42, background: color, boxShadow: glow(color, 0.6), transform: 'rotate(45deg)'}} />
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: size, lineHeight: 1.25, color: C.text}}>{text}</div>
    </div>
  );
};

const Stat: React.FC<{value: string; label: string; color: string; delay: number}> = ({value, label, color, delay}) => {
  const f = useCurrentFrame();
  const m = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  let shown = value;
  if (m) {
    const num = parseFloat(m[2].replace(/,/g, ''));
    const decimals = (m[2].split('.')[1] || '').length;
    const p = interpolate(f, [delay, delay + 36], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
    const n = (num * p).toFixed(decimals);
    shown = m[1] + (m[2].includes(',') ? Number(n).toLocaleString('en-US', {minimumFractionDigits: decimals}) : n) + m[3];
  }
  const s = useIn(delay);
  return (
    <div style={{width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: fit(value, 230, 120, 5), color: C.text, textShadow: glow(color, 1.4), opacity: s, transform: `scale(${0.8 + 0.2 * s})`}}>{shown}</div>
      <div style={{width: 680}}><Point text={label} color={color} delay={delay + 26} size={fit(label, 44, 32, 40)} /></div>
    </div>
  );
};

const List: React.FC<{items: string[]; color: string; delay: number}> = ({items, color, delay}) => (
  <Box color={color} delay={delay} style={{width: W - 40, padding: '40px 44px 22px'}}>
    {items.map((it, i) => (
      <Point key={i} text={it} color={ACCENTS[(i + 1) % ACCENTS.length]} delay={delay + 10 + i * 10} size={fit(it, 42, 30, 36)} />
    ))}
  </Box>
);

const Cycle: React.FC<{nodes: string[]; color: string; delay: number}> = ({nodes, color, delay}) => {
  const f = useCurrentFrame();
  const H = 820;
  const cx = W / 2, cy = H / 2, r = 300;
  const ring = interpolate(f, [delay, delay + 30], [0, 1], clamp);
  const a = (f - delay) * 0.035 - Math.PI / 2;
  return (
    <div style={{position: 'relative', width: W, height: H}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, filter: svgGlow(color)}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform={`rotate(-90 ${cx} ${cy})`} />
        {ring > 0.99 && <circle cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={12} fill={C.text} />}
      </svg>
      {nodes.map((n, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / nodes.length;
        const c = ACCENTS[(i + 1) % ACCENTS.length];
        return (
          <div key={i} style={{position: 'absolute', left: cx + r * Math.cos(ang), top: cy + r * Math.sin(ang), transform: 'translate(-50%, -50%)', width: 'max-content'}}>
            <Box color={c} delay={delay + 10 + i * 10} style={{maxWidth: 290, padding: '16px 22px', textAlign: 'center'}}>
              <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(n, 36, 26, 18), color: C.text}}>{n}</span>
            </Box>
          </div>
        );
      })}
    </div>
  );
};

const Quote: React.FC<{text: string; color: string; delay: number}> = ({text, color, delay}) => {
  const s = useIn(delay);
  return (
    <div style={{width: W, display: 'flex', gap: 34, opacity: s}}>
      <div style={{flex: 'none', width: 8, background: color, boxShadow: glow(color, 0.8), borderRadius: 4}} />
      <div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 200, lineHeight: 0.8, height: 110, color, textShadow: glow(color, 1)}}>“</div>
        <div style={{fontFamily: SANS, fontWeight: 500, fontSize: fit(text, 58, 40, 90), lineHeight: 1.25, color: C.text}}>{text}</div>
      </div>
    </div>
  );
};

export const VisualBlock: React.FC<{v: Visual; color: string; delay: number}> = ({v, color, delay}) => {
  switch (v.type) {
    case 'flow': return <Flow steps={v.steps} color={color} delay={delay} />;
    case 'contrast': return <Contrast v={v} delay={delay} />;
    case 'stat': return <Stat value={v.value} label={v.label} color={color} delay={delay} />;
    case 'list': return <List items={v.items} color={color} delay={delay} />;
    case 'cycle': return <Cycle nodes={v.nodes} color={color} delay={delay} />;
    case 'quote': return <Quote text={v.text} color={color} delay={delay} />;
  }
};
