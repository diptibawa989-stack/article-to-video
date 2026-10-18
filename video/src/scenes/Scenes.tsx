import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Scene} from '../components/Scene';
import {Kicker, Line, Neon, Words} from '../components/Text';
import {VisualBlock} from '../components/Visuals';
import {NeonIcon} from '../components/Icon';
import {ACCENTS, C, MONO, SANS, fit, glow, svgGlow} from '../theme';
import type {Idea, Storyboard} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const Intro: React.FC<{sb: Storyboard; dur: number}> = ({sb, dur}) => (
  <Scene dur={dur}>
    <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 44}}>
      <Kicker text="THE READ" color={C.pink} />
      <Neon text={sb.title} color={C.pink} size={fit(sb.title, 118, 70, 34)} delay={10} />
      <Line color={C.cyan} delay={22} width={420} />
      <Words text={[sb.author ? `by ${sb.author}` : '', sb.publication, sb.readMinutes ? `${sb.readMinutes} min read` : ''].filter(Boolean).join(' · ')} size={38} delay={30} perWord={1.2} />
      {sb.topics && sb.topics.length > 0 && <Chips items={sb.topics} delay={46} />}
      {sb.whyPicked && <Words text={`Why this one: ${sb.whyPicked}`} size={34} color={C.lime} delay={60} perWord={1.4} />}
    </div>
  </Scene>
);

const Chips: React.FC<{items: string[]; delay: number}> = ({items, delay}) => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
      {items.map((t, i) => {
        const c = ACCENTS[i % ACCENTS.length];
        const o = interpolate(f, [delay + i * 5, delay + i * 5 + 8], [0, 1], clamp);
        return (
          <span key={i} style={{opacity: o, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 2, color: c, border: `2px solid ${c}`, boxShadow: glow(c, 0.4), borderRadius: 999, padding: '10px 22px'}}>
            #{t.toUpperCase()}
          </span>
        );
      })}
    </div>
  );
};

export const Statement: React.FC<{kicker: string; text: string; color: string; dur: number; boxed?: boolean}> = ({kicker, text, color, dur, boxed}) => {
  const f = useCurrentFrame();
  const frame = interpolate(f, [8, 30], [0, 1], clamp);
  return (
    <Scene dur={dur}>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 48}}>
        <Kicker text={kicker} color={color} />
        <div style={{position: 'relative', padding: boxed ? '56px 52px' : 0}}>
          {boxed && (
            <svg width="100%" height="100%" style={{position: 'absolute', inset: 0, overflow: 'visible', filter: svgGlow(color)}}>
              <rect x={0} y={0} width="100%" height="100%" rx={28} fill="none" stroke={color} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - frame} />
            </svg>
          )}
          <Words text={text} size={fit(text, 78, 50, 70)} color={C.text} delay={10} perWord={2.6} />
        </div>
      </div>
    </Scene>
  );
};

export const IdeaScene: React.FC<{idea: Idea; i: number; n: number; dur: number}> = ({idea, i, n, dur}) => {
  const color = ACCENTS[i % ACCENTS.length];
  const headlineDone = 18;
  const visualDelay = headlineDone + 6;
  const bodyDelay = visualDelay + 34;
  return (
    <Scene dur={dur}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
          {idea.icon && <IconPop name={idea.icon} color={color} />}
          <Kicker text={`IDEA ${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`} color={color} />
        </div>
        <Neon text={idea.headline} color={color} size={fit(idea.headline, 82, 54, 40)} delay={4} />
      </div>
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 0'}}>
        <VisualBlock v={idea.visual} color={color} delay={visualDelay} dur={dur} />
      </div>
      <Words text={idea.body} size={fit(idea.body, 42, 32, 120)} delay={bodyDelay} perWord={1.6} />
    </Scene>
  );
};

const IconPop: React.FC<{name: string; color: string}> = ({name, color}) => {
  const f = useCurrentFrame();
  const s = interpolate(f, [2, 12], [0, 1], clamp);
  return (
    <div style={{width: 76, height: 76, borderRadius: 20, border: `3px solid ${color}`, boxShadow: glow(color, 0.6), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: s, transform: `scale(${0.6 + 0.4 * s}) rotate(${(1 - s) * -20}deg)`}}>
      <NeonIcon name={name} color={color} size={46} />
    </div>
  );
};

export const MapScene: React.FC<{sb: Storyboard; dur: number}> = ({sb, dur}) => {
  const f = useCurrentFrame();
  const W = 900, H = 1100, cx = W / 2, cy = H / 2, RX = 320, RY = 420;
  const n = sb.ideas.length;
  const center = interpolate(f, [6, 20], [0, 1], clamp);
  return (
    <Scene dur={dur}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
        <Kicker text="THE MAP" color={C.cyan} />
        <Neon text="The whole piece on one screen" color={C.cyan} size={64} delay={4} />
      </div>
      <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', width: W, height: H}}>
          <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
            {sb.ideas.map((_, i) => {
              const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
              const c = ACCENTS[i % ACCENTS.length];
              const p = interpolate(f, [20 + i * 8, 34 + i * 8], [0, 1], clamp);
              return (
                <line key={i} x1={cx} y1={cy} x2={cx + RX * Math.cos(ang) * p} y2={cy + RY * Math.sin(ang) * p} stroke={c} strokeWidth={4} style={{filter: svgGlow(c)}} />
              );
            })}
          </svg>
          <div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${center})`, width: 300, height: 300, borderRadius: 150, background: C.bg, border: `4px solid ${C.text}`, boxShadow: glow(C.violet, 1.2), display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 30}}>
            <span style={{fontFamily: SANS, fontWeight: 700, fontSize: fit(sb.mapCenter, 44, 30, 16), color: C.text, lineHeight: 1.1}}>{sb.mapCenter}</span>
          </div>
          {sb.ideas.map((idea, i) => {
            const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
            const c = ACCENTS[i % ACCENTS.length];
            const o = interpolate(f, [30 + i * 8, 40 + i * 8], [0, 1], clamp);
            return (
              <div key={i} style={{position: 'absolute', left: cx + RX * Math.cos(ang), top: cy + RY * Math.sin(ang), transform: 'translate(-50%,-50%)', opacity: o, width: 'max-content', background: C.bg, border: `3px solid ${c}`, boxShadow: glow(c, 0.6), borderRadius: 20, padding: '14px 22px', maxWidth: 280, textAlign: 'center'}}>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 22, color: c, marginBottom: 6}}>
                  {idea.icon && <NeonIcon name={idea.icon} color={c} size={30} strokeWidth={2} />}
                  <span>{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(idea.label, 34, 26, 16), color: C.text, lineHeight: 1.15}}>{idea.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Scene>
  );
};

export const Outro: React.FC<{sb: Storyboard; dur: number}> = ({sb, dur}) => {
  let host = sb.url;
  try { host = new URL(sb.url).host + new URL(sb.url).pathname; } catch {}
  return (
    <Scene dur={dur}>
      <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 40}}>
        <Kicker text="READ THE FULL PIECE" color={C.lime} />
        <Neon text={sb.title} color={C.lime} size={fit(sb.title, 80, 52, 40)} delay={6} />
        <Words text={[sb.author, sb.publication].filter(Boolean).join(' · ')} size={38} delay={16} perWord={1.2} />
        <div style={{fontFamily: MONO, fontSize: 26, color: C.cyan, textShadow: glow(C.cyan, 0.4), wordBreak: 'break-all'}}>{host}</div>
      </div>
      <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: C.dim}}>A PERSONAL SUMMARY · THE IDEAS BELONG TO THE AUTHOR</div>
    </Scene>
  );
};
