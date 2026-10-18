import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACCENTS, C, MONO, SANS, fit, glow, svgGlow} from '../theme';
import type {Visual} from '../types';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const W = 900;
const H = 820;

type VP = {color: string; delay: number; dur: number};

const useIn = (delay: number) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping: 18, stiffness: 120}});
};

// Walks a highlight through n items once they have all appeared, so the eye follows the explanation.
const useFocus = (n: number, start: number, dur: number) => {
  const f = useCurrentFrame();
  const end = dur - 24;
  if (n <= 0 || f < start || end <= start) return -1;
  return Math.min(n - 1, Math.floor(((f - start) / (end - start)) * n));
};
const dim = (i: number, focus: number) => (focus < 0 || i === focus ? 1 : 0.4);

const Box: React.FC<{color: string; delay: number; children: React.ReactNode; style?: React.CSSProperties; active?: boolean; fade?: number}> = ({
  color, delay, children, style, active, fade = 1,
}) => {
  const s = useIn(delay);
  const g = active ? 1.1 : 0.5;
  const {padding = '22px 28px', ...rest} = style || {};
  // the solid backing stays opaque when the box is dimmed, so lines behind it never show through
  return (
    <div style={{borderRadius: 22, background: C.bg, opacity: s, transform: `scale(${(0.9 + s * 0.1) * (active ? 1.03 : 1)})`, ...rest, padding: 0, display: 'block'}}>
      <div
        style={{
          border: `3px solid ${color}`,
          boxShadow: `${glow(color, g)}, inset 0 0 ${active ? 36 : 24}px ${color}${active ? '66' : '44'}`,
          borderRadius: 22,
          padding,
          opacity: fade,
          height: '100%',
          boxSizing: 'border-box',
          display: rest.display,
          alignItems: rest.alignItems,
          justifyContent: rest.justifyContent,
          gap: rest.gap,
          textAlign: rest.textAlign,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Point: React.FC<{text: string; color: string; delay: number; size: number; fade?: number}> = ({text, color, delay, size, fade = 1}) => {
  const s = useIn(delay);
  return (
    <div style={{display: 'flex', gap: 18, marginBottom: 22, opacity: s * fade, transform: `translateX(${(1 - s) * 30}px)`}}>
      <div style={{flex: 'none', width: 16, height: 16, marginTop: size * 0.42, background: color, boxShadow: glow(color, 0.6), transform: 'rotate(45deg)'}} />
      <div style={{fontFamily: SANS, fontWeight: 500, fontSize: size, lineHeight: 1.25, color: C.text}}>{text}</div>
    </div>
  );
};

/* ---------- original six ---------- */

const Flow: React.FC<VP & {steps: string[]}> = ({steps, color, delay, dur}) => {
  const f = useCurrentFrame();
  const gap = 16;
  const focus = useFocus(steps.length, delay + steps.length * gap + 12, dur);
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: W}}>
      {steps.map((s, i) => {
        const d = delay + i * gap;
        const lineP = interpolate(f, [d + 8, d + 16], [0, 1], clamp);
        const c = i === steps.length - 1 ? C.lime : color;
        return (
          <React.Fragment key={i}>
            <Box color={c} delay={d} active={focus === i} fade={dim(i, focus)} style={{width: 760, display: 'flex', alignItems: 'center', gap: 24}}>
              <span style={{fontFamily: MONO, fontSize: 30, color: c, textShadow: glow(c, 0.5)}}>{String(i + 1).padStart(2, '0')}</span>
              <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(s, 42, 30, 34), color: C.text}}>{s}</span>
            </Box>
            {i < steps.length - 1 && (
              <div style={{width: 4, height: 54, background: color, boxShadow: glow(color, 0.5), transform: `scaleY(${lineP})`, transformOrigin: 'top', opacity: focus > i ? 1 : 0.7}} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Contrast: React.FC<VP & {v: Extract<Visual, {type: 'contrast'}>}> = ({v, delay, dur}) => {
  const vs = useIn(delay + 6);
  const focus = useFocus(2, delay + 50, dur);
  const col = (side: {label: string; points: string[]}, color: string, d: number, i: number) => (
    <Box color={color} delay={d} active={focus === i} fade={dim(i, focus)} style={{width: 410, minHeight: 520}}>
      <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 3, color, textShadow: glow(color, 0.6), marginBottom: 26}}>{side.label.toUpperCase()}</div>
      {side.points.map((p, j) => (
        <Point key={j} text={p} color={color} delay={d + 10 + j * 8} size={fit(p, 36, 28, 40)} />
      ))}
    </Box>
  );
  return (
    <div style={{position: 'relative', display: 'flex', justifyContent: 'space-between', width: W}}>
      {col(v.left, C.pink, delay, 0)}
      {col(v.right, C.cyan, delay + 8, 1)}
      <div style={{position: 'absolute', left: W / 2 - 46, top: 220, width: 92, height: 92, borderRadius: 46, background: C.bg, border: `3px solid ${C.text}`, boxShadow: glow(C.violet, 0.8), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 32, color: C.text, opacity: vs, transform: `scale(${vs})`}}>VS</div>
    </div>
  );
};

const countUp = (value: string, p: number) => {
  const m = value.match(/^([^\d]*)([\d.,]+)(.*)$/);
  if (!m) return value;
  const num = parseFloat(m[2].replace(/,/g, ''));
  const decimals = (m[2].split('.')[1] || '').length;
  const n = (num * p).toFixed(decimals);
  return m[1] + (m[2].includes(',') ? Number(n).toLocaleString('en-US', {minimumFractionDigits: decimals}) : n) + m[3];
};

const Stat: React.FC<VP & {value: string; label: string}> = ({value, label, color, delay}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [delay, delay + 36], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const s = useIn(delay);
  const pulse = 1 + 0.25 * Math.max(0, Math.sin((f - delay - 40) / 9));
  return (
    <div style={{width: W, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: fit(value, 230, 120, 5), color: C.text, textShadow: glow(color, 1.4 * (f > delay + 40 ? pulse : 1)), opacity: s, transform: `scale(${0.8 + 0.2 * s})`}}>{countUp(value, p)}</div>
      <div style={{width: 680}}><Point text={label} color={color} delay={delay + 26} size={fit(label, 44, 32, 40)} /></div>
    </div>
  );
};

const List: React.FC<VP & {items: string[]}> = ({items, color, delay, dur}) => {
  const focus = useFocus(items.length, delay + 10 + items.length * 10 + 10, dur);
  return (
    <Box color={color} delay={delay} style={{width: W - 40, padding: '40px 44px 22px'}}>
      {items.map((it, i) => (
        <Point key={i} text={it} color={ACCENTS[(i + 1) % ACCENTS.length]} delay={delay + 10 + i * 10} size={fit(it, 42, 30, 36)} fade={dim(i, focus)} />
      ))}
    </Box>
  );
};

const Cycle: React.FC<VP & {nodes: string[]}> = ({nodes, color, delay, dur}) => {
  const f = useCurrentFrame();
  const cx = W / 2, cy = H / 2, r = 300;
  const ring = interpolate(f, [delay, delay + 30], [0, 1], clamp);
  const n = nodes.length;
  const focus = useFocus(n, delay + 10 + n * 10 + 6, dur);
  // the travelling dot sits on the focused node's arc
  const start = delay + 10 + n * 10 + 6;
  const prog = f < start ? 0 : ((f - start) / Math.max(1, dur - 24 - start)) * n;
  const a = -Math.PI / 2 + (Math.min(prog, n) * 2 * Math.PI) / n;
  return (
    <div style={{position: 'relative', width: W, height: H}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, filter: svgGlow(color)}}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - ring} transform={`rotate(-90 ${cx} ${cy})`} />
        {ring > 0.99 && <circle cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={13} fill={C.text} />}
      </svg>
      {nodes.map((node, i) => {
        const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        const c = ACCENTS[(i + 1) % ACCENTS.length];
        return (
          <div key={i} style={{position: 'absolute', left: cx + r * Math.cos(ang), top: cy + r * Math.sin(ang), transform: 'translate(-50%, -50%)', width: 'max-content'}}>
            <Box color={c} delay={delay + 10 + i * 10} active={focus === i} fade={dim(i, focus)} style={{maxWidth: 290, padding: '16px 22px', textAlign: 'center'}}>
              <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(node, 36, 26, 18), color: C.text}}>{node}</span>
            </Box>
          </div>
        );
      })}
    </div>
  );
};

const Quote: React.FC<VP & {text: string}> = ({text, color, delay}) => {
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

/* ---------- new shapes ---------- */

const Timeline: React.FC<VP & {events: {when: string; what: string}[]}> = ({events, color, delay, dur}) => {
  const f = useCurrentFrame();
  const n = events.length;
  const gap = 14;
  const line = interpolate(f, [delay, delay + n * gap + 10], [0, 1], clamp);
  const focus = useFocus(n, delay + n * gap + 14, dur);
  return (
    <div style={{position: 'relative', width: W, padding: '10px 0 10px 0'}}>
      <div style={{position: 'absolute', left: 38, top: 20, bottom: 20, width: 4, background: color, boxShadow: glow(color, 0.6), transform: `scaleY(${line})`, transformOrigin: 'top'}} />
      {events.map((e, i) => {
        const s = interpolate(f, [delay + i * gap, delay + i * gap + 12], [0, 1], clamp);
        const c = ACCENTS[(i + 1) % ACCENTS.length];
        const on = focus === i;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: 40, marginBottom: 44, opacity: s * dim(i, focus), transform: `translateX(${(1 - s) * 30}px)`}}>
            <div style={{flex: 'none', marginLeft: 18, marginTop: 8, width: 44, height: 44, borderRadius: 22, background: on ? c : C.bg, border: `4px solid ${c}`, boxShadow: glow(c, on ? 1.2 : 0.6)}} />
            <div>
              <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 3, color: c, textShadow: glow(c, 0.5)}}>{e.when.toUpperCase()}</div>
              <div style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(e.what, 42, 32, 34), color: C.text, marginTop: 6, lineHeight: 1.2}}>{e.what}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Matrix: React.FC<VP & {v: Extract<Visual, {type: 'matrix'}>}> = ({v, color, delay, dur}) => {
  const f = useCurrentFrame();
  const S = 720;
  const axes = interpolate(f, [delay, delay + 18], [0, 1], clamp);
  const hl = typeof v.highlight === 'number' ? v.highlight : -1;
  const walkStart = delay + 60;
  // with a highlight: walk the four quadrants briskly, then rest on the one that matters
  const walkEnd = hl >= 0 ? Math.min(dur - 60, walkStart + 4 * 26) : dur - 24;
  const focus = useFocus(4, walkStart, walkEnd + 24);
  const settled = hl >= 0 && f > walkEnd;
  const cells = [0, 1, 2, 3];
  return (
    <div style={{position: 'relative', width: W, height: S + 110}}>
      {/* y axis label */}
      <div style={{position: 'absolute', left: 0, top: 0, height: S, width: 60, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 22, color: C.dim, opacity: axes}}>
        <span style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>{v.yAxis[1].toUpperCase()} ↑</span>
        <span style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)'}}>{v.yAxis[0].toUpperCase()}</span>
      </div>
      <div style={{position: 'absolute', left: 90, top: 0, width: S, height: S, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 18}}>
        {cells.map((i) => {
          const c = ACCENTS[(i + 1) % ACCENTS.length];
          const on = settled ? i === hl : focus === i;
          const fade = settled ? (i === hl ? 1 : 0.35) : dim(i, focus);
          return (
            <Box key={i} color={c} delay={delay + 14 + i * 9} active={on} fade={fade} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24}}>
              <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(v.quadrants[i], 38, 28, 22), color: C.text, lineHeight: 1.2}}>{v.quadrants[i]}</span>
            </Box>
          );
        })}
      </div>
      {/* x axis label */}
      <div style={{position: 'absolute', left: 90, top: S + 26, width: S, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 22, color: C.dim, opacity: axes}}>
        <span>{v.xAxis[0].toUpperCase()}</span>
        <span>{v.xAxis[1].toUpperCase()} →</span>
      </div>
      <div style={{position: 'absolute', left: 90, top: S + 70, width: S * axes, height: 3, background: color, boxShadow: glow(color, 0.5)}} />
    </div>
  );
};

const Funnel: React.FC<VP & {stages: string[]}> = ({stages, delay, dur}) => {
  const f = useCurrentFrame();
  const n = stages.length;
  const rowH = 128, gap = 16, top = 860, bottom = 380;
  const focus = useFocus(n, delay + n * 12 + 12, dur);
  const totalH = n * rowH + (n - 1) * gap;
  return (
    <div style={{position: 'relative', width: W, height: totalH}}>
      {stages.map((s, i) => {
        const w1 = top - ((top - bottom) * i) / n;
        const w2 = top - ((top - bottom) * (i + 1)) / n;
        const y = i * (rowH + gap);
        const c = ACCENTS[i % ACCENTS.length];
        const p = interpolate(f, [delay + i * 12, delay + i * 12 + 14], [0, 1], clamp);
        const on = focus === i;
        const x1 = (W - w1) / 2, x2 = (W - w2) / 2;
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: y, width: W, height: rowH, opacity: p * dim(i, focus), transform: `translateY(${(1 - p) * -20}px)`}}>
            <svg width={W} height={rowH} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: svgGlow(c)}}>
              <polygon points={`${x1},2 ${x1 + w1},2 ${x2 + w2},${rowH - 2} ${x2},${rowH - 2}`} fill={on ? `${c}33` : 'rgba(7,5,15,0.78)'} stroke={c} strokeWidth={on ? 5 : 3} strokeLinejoin="round" />
            </svg>
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${x2 + 30}px`, textAlign: 'center'}}>
              <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(s, 40, 28, Math.max(10, 26 - i * 3)), color: C.text, lineHeight: 1.15}}>{s}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Iceberg: React.FC<VP & {above: string[]; below: string[]}> = ({above, below, color, delay, dur}) => {
  const f = useCurrentFrame();
  const waterY = 250;
  const berg = interpolate(f, [delay, delay + 24], [0, 1], clamp);
  const reveal = interpolate(f, [delay + 30, delay + 60], [0, 1], clamp);
  const n = below.length;
  const focus = useFocus(n, delay + 64 + n * 10, dur);
  const wave = (x: number) => waterY + Math.sin(x / 70 + f / 10) * 6;
  const wavePts = Array.from({length: 46}, (_, i) => `${i * 20},${wave(i * 20)}`).join(' ');
  return (
    <div style={{position: 'relative', width: W, height: H}}>
      <svg width={W} height={H} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        {/* tip */}
        <polygon points={`${W / 2 - 150},${waterY} ${W / 2 - 30},${waterY - 170} ${W / 2 + 60},${waterY - 120} ${W / 2 + 160},${waterY}`} fill="rgba(7,5,15,0.6)" stroke={C.text} strokeWidth={4} opacity={berg} style={{filter: svgGlow(C.cyan)}} />
        {/* mass below */}
        <polygon points={`${W / 2 - 150},${waterY} ${W / 2 + 160},${waterY} ${W / 2 + 400},${waterY + 230} ${W / 2 + 300},${H - 30} ${W / 2 - 320},${H - 20} ${W / 2 - 410},${waterY + 260}`} fill={`${C.violet}1f`} stroke={C.violet} strokeWidth={4} opacity={berg * (0.4 + 0.6 * reveal)} style={{filter: svgGlow(C.violet)}} />
        <polyline points={wavePts} fill="none" stroke={color} strokeWidth={4} style={{filter: svgGlow(color)}} />
      </svg>
      <div style={{position: 'absolute', right: 0, top: waterY - 52, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.dim}}>WHAT YOU SEE ↑</div>
      <div style={{position: 'absolute', right: 0, top: waterY + 20, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.dim}}>WHAT'S HIDDEN ↓</div>
      <div style={{position: 'absolute', left: 0, top: 20, width: 330, display: 'flex', flexDirection: 'column', gap: 6}}>
        {above.map((t, i) => (
          <Point key={i} text={t} color={C.cyan} delay={delay + 14 + i * 8} size={fit(t, 34, 26, 22)} />
        ))}
      </div>
      <div style={{position: 'absolute', left: 150, right: 150, top: waterY + 90, display: 'flex', flexDirection: 'column', gap: 4}}>
        {below.map((t, i) => (
          <Point key={i} text={t} color={ACCENTS[(i + 1) % ACCENTS.length]} delay={delay + 60 + i * 10} size={fit(t, 38, 28, 26)} fade={dim(i, focus)} />
        ))}
      </div>
    </div>
  );
};

const Spectrum: React.FC<VP & {v: Extract<Visual, {type: 'spectrum'}>}> = ({v, delay}) => {
  const f = useCurrentFrame();
  const barW = 820;
  const bar = interpolate(f, [delay, delay + 22], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const m = Math.max(0, Math.min(100, v.marker));
  const slide = interpolate(f, [delay + 26, delay + 66], [0, m], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const lbl = interpolate(f, [delay + 60, delay + 72], [0, 1], clamp);
  const x = (barW * slide) / 100;
  return (
    <div style={{position: 'relative', width: W, height: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
      <div style={{position: 'relative', marginLeft: (W - barW) / 2, width: barW}}>
        <div style={{position: 'absolute', left: Math.min(Math.max(x - 200, 0), barW - 400), top: -100, width: 400, textAlign: x < 200 ? 'left' : x > barW - 200 ? 'right' : 'center', opacity: lbl}}>
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: fit(v.markerLabel, 44, 32, 20), color: C.text, textShadow: glow(C.lime, 0.8)}}>{v.markerLabel}</span>
        </div>
        <div style={{height: 26, borderRadius: 13, width: barW * bar, background: `linear-gradient(90deg, ${C.cyan}, ${C.violet}, ${C.pink})`, boxShadow: `0 0 18px ${C.violet}aa`}} />
        <div style={{position: 'absolute', left: x - 22, top: -22, width: 44, height: 70, borderRadius: 22, background: C.bg, border: `5px solid ${C.lime}`, boxShadow: glow(C.lime, 1), opacity: bar > 0.98 ? 1 : 0}} />
        <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 50, opacity: bar}}>
          <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.cyan, textShadow: glow(C.cyan, 0.5), maxWidth: 380}}>{v.left.toUpperCase()}</span>
          <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: C.pink, textShadow: glow(C.pink, 0.5), maxWidth: 380, textAlign: 'right'}}>{v.right.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

const Venn: React.FC<VP & {v: Extract<Visual, {type: 'venn'}>}> = ({v, delay}) => {
  const f = useCurrentFrame();
  const R = 250;
  const slide = interpolate(f, [delay, delay + 30], [120, 0], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  const o = interpolate(f, [delay, delay + 14], [0, 1], clamp);
  const mid = interpolate(f, [delay + 34, delay + 50], [0, 1], clamp);
  const pulse = 1 + 0.4 * Math.max(0, Math.sin((f - delay - 50) / 10));
  const cx1 = W / 2 - 150 - slide, cx2 = W / 2 + 150 + slide, cy = 330;
  return (
    <div style={{position: 'relative', width: W, height: 680}}>
      <svg width={W} height={680} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <circle cx={cx1} cy={cy} r={R} fill={`${C.cyan}14`} stroke={C.cyan} strokeWidth={4} opacity={o} style={{filter: svgGlow(C.cyan)}} />
        <circle cx={cx2} cy={cy} r={R} fill={`${C.pink}14`} stroke={C.pink} strokeWidth={4} opacity={o} style={{filter: svgGlow(C.pink)}} />
      </svg>
      <div style={{position: 'absolute', left: cx1 - 230, top: cy - 60, width: 230, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: o}}>
        <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(v.left, 36, 26, 14), color: C.text}}>{v.left}</span>
      </div>
      <div style={{position: 'absolute', left: cx2, top: cy - 60, width: 230, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: o}}>
        <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(v.right, 36, 26, 14), color: C.text}}>{v.right}</span>
      </div>
      <div style={{position: 'absolute', left: W / 2 - 100, top: cy - 70, width: 200, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', opacity: mid, transform: `scale(${0.8 + 0.2 * mid})`}}>
        <span style={{fontFamily: SANS, fontWeight: 700, fontSize: fit(v.overlap, 38, 26, 12), color: C.lime, textShadow: glow(C.lime, 0.8 * pulse), lineHeight: 1.1}}>{v.overlap}</span>
      </div>
    </div>
  );
};

const Bars: React.FC<VP & {items: {label: string; value: number}[]; unit?: string}> = ({items, unit = '', delay, dur}) => {
  const f = useCurrentFrame();
  const max = Math.max(...items.map((x) => x.value), 1);
  const n = items.length;
  const focus = useFocus(n, delay + n * 10 + 40, dur);
  const fmt = (v: number) => {
    const dec = Number.isInteger(v) ? 0 : 1;
    const pre = /^[$€£₹]/.test(unit) ? unit : '';
    const post = pre ? '' : unit;
    return pre + v.toLocaleString('en-US', {minimumFractionDigits: dec, maximumFractionDigits: dec}) + post;
  };
  return (
    <div style={{width: W, display: 'flex', flexDirection: 'column', gap: 34}}>
      {items.map((it, i) => {
        const c = ACCENTS[i % ACCENTS.length];
        const p = interpolate(f, [delay + i * 10, delay + i * 10 + 34], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
        const w = Math.max(0.02, it.value / max) * 640 * p;
        return (
          <div key={i} style={{opacity: dim(i, focus)}}>
            <div style={{fontFamily: SANS, fontWeight: 600, fontSize: fit(it.label, 34, 26, 28), color: C.text, marginBottom: 10}}>{it.label}</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 20}}>
              <div style={{height: 54, width: w, borderRadius: 12, background: `linear-gradient(90deg, ${c}55, ${c})`, boxShadow: glow(c, focus === i ? 1 : 0.5)}} />
              <span style={{fontFamily: MONO, fontWeight: 700, fontSize: 34, color: c, textShadow: glow(c, 0.5)}}>{fmt(Number((it.value * p).toFixed(Number.isInteger(it.value) ? 0 : 1)))}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const VisualBlock: React.FC<{v: Visual} & VP> = ({v, color, delay, dur}) => {
  const vp = {color, delay, dur};
  switch (v.type) {
    case 'flow': return <Flow steps={v.steps} {...vp} />;
    case 'contrast': return <Contrast v={v} {...vp} />;
    case 'stat': return <Stat value={v.value} label={v.label} {...vp} />;
    case 'list': return <List items={v.items} {...vp} />;
    case 'cycle': return <Cycle nodes={v.nodes} {...vp} />;
    case 'quote': return <Quote text={v.text} {...vp} />;
    case 'timeline': return <Timeline events={v.events} {...vp} />;
    case 'matrix': return <Matrix v={v} {...vp} />;
    case 'funnel': return <Funnel stages={v.stages} {...vp} />;
    case 'iceberg': return <Iceberg above={v.above} below={v.below} {...vp} />;
    case 'spectrum': return <Spectrum v={v} {...vp} />;
    case 'venn': return <Venn v={v} {...vp} />;
    case 'bars': return <Bars items={v.items} unit={v.unit} {...vp} />;
  }
};
