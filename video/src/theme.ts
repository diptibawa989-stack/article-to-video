import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';

export const C = {
  bg: '#07050F',
  deep: '#160A33',
  cyan: '#00F0FF',
  pink: '#FF2BD6',
  lime: '#C6FF3D',
  violet: '#9D6BFF',
  amber: '#FFB23D',
  text: '#F5F2FF',
  dim: 'rgba(245,242,255,0.72)',
};

export const ACCENTS = [C.cyan, C.pink, C.lime, C.violet, C.amber];

export const SANS = '"Space Grotesk", system-ui, sans-serif';
export const MONO = '"JetBrains Mono", ui-monospace, monospace';

export const PAD = 90;

export const glow = (c: string, s = 1) =>
  `0 0 ${4 * s}px ${c}, 0 0 ${14 * s}px ${c}, 0 0 ${36 * s}px ${c}99`;

export const svgGlow = (c: string) =>
  `drop-shadow(0 0 4px ${c}) drop-shadow(0 0 14px ${c}aa)`;

// Shrinks long text so it still fits
export const fit = (text: string, max: number, min: number, idealChars: number) => {
  const len = text.length;
  if (len <= idealChars) return max;
  return Math.max(min, Math.round(max * Math.sqrt(idealChars / len)));
};
