import React from 'react';
import {icons} from 'lucide-react';

export const toIconName = (name?: string) =>
  (name || '').trim().replace(/(^|[-_\s]+)([a-z0-9])/gi, (_, __, c: string) => c.toUpperCase());

export const NeonIcon: React.FC<{name?: string; color: string; size: number; strokeWidth?: number}> = ({name, color, size, strokeWidth = 1.8}) => {
  const Cmp = (icons as Record<string, React.FC<any>>)[toIconName(name)];
  if (!Cmp) return null;
  return <Cmp size={size} color={color} strokeWidth={strokeWidth} style={{filter: `drop-shadow(0 0 4px ${color}) drop-shadow(0 0 12px ${color}aa)`}} />;
};
