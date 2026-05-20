import React from 'react';
import { Platform, Text } from 'react-native';

type IconName =
  // priority
  | 'urgent' | 'high' | 'medium' | 'low'
  // category
  | 'work' | 'personal' | 'health' | 'finance' | 'study' | 'home' | 'other'
  // logistics
  | 'hotel' | 'airplane' | 'van' | 'pin' | 'clock' | 'bell' | 'tag' | 'check'
  // hotel manager
  | 'bed' | 'people' | 'music' | 'close' | 'chevronRight' | 'chevronDown' | 'chevronUp' | 'plus' | 'minus'
  // misc
  | 'phone' | 'key' | 'refresh' | 'mic';

interface Props { name: IconName; color?: string; size?: number; fill?: string }

const EMOJI_FALLBACK: Record<IconName, string> = {
  urgent: '🔥', high: '⚡', medium: '📌', low: '🌱',
  work: '💼', personal: '🧍', health: '🏃', finance: '💰', study: '📚', home: '🏠', other: '📋',
  hotel: '🏨', airplane: '✈️', van: '🚐', pin: '📍', clock: '🕐', bell: '🔔', tag: '🏷', check: '✓',
  bed: '🛏', people: '👥', music: '🎵', close: '✕', chevronRight: '›', chevronDown: '▼', chevronUp: '▲', plus: '+', minus: '−',
  phone: '📞',
  key: '🔑',
  refresh: '↻',
  mic: '🎤',
};

function svg(size: number, children: React.ReactElement | React.ReactElement[], extraProps?: object) {
  return React.createElement(
    'svg' as any,
    { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', style: { display: 'block' }, ...extraProps },
    ...(Array.isArray(children) ? children : [children]),
  );
}
function path(d: string, stroke: string, w = 2, extra?: object) {
  return React.createElement('path' as any, { key: d.slice(0, 12), d, stroke, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round', ...extra });
}
function circle(cx: number, cy: number, r: number, stroke: string, w = 2, fillColor?: string) {
  return React.createElement('circle' as any, { key: `c${cx}${cy}`, cx, cy, r, stroke, strokeWidth: w, ...(fillColor ? { fill: fillColor } : {}) });
}
function line(x1: number, y1: number, x2: number, y2: number, stroke: string, w = 2) {
  return React.createElement('line' as any, { key: `l${x1}${y1}`, x1, y1, x2, y2, stroke, strokeWidth: w, strokeLinecap: 'round' });
}
function rect(x: number, y: number, width: number, height: number, rx: number, stroke: string, w = 2) {
  return React.createElement('rect' as any, { key: `r${x}${y}`, x, y, width, height, rx, stroke, strokeWidth: w });
}

function renderIcon(name: IconName, color: string, size: number, fill?: string): React.ReactElement {
  const s = color;
  const w = 2;
  switch (name) {
    // ── Priority ───────────────────────────────────────────────────────────────
    case 'urgent':
      return svg(size, [
        path('M12 9v4', s, w),
        path('M12 17h.01', s, w + 0.5),
        path('M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z', s, w),
      ]);
    case 'high':
      return svg(size, [
        path('M13 2L3 14h9l-1 8 10-12h-9l1-8z', s, w),
      ]);
    case 'medium':
      return svg(size, [
        path('M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', s, w),
        circle(12, 9, 2, s, w),
      ]);
    case 'low':
      return svg(size, [
        path('M12 5v14', s, w),
        path('M19 12l-7 7-7-7', s, w),
      ]);

    // ── Category ───────────────────────────────────────────────────────────────
    case 'work':
      return svg(size, [
        rect(2, 7, 20, 14, 2, s, w),
        path('M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2', s, w),
        line(12, 12, 12, 16, s, w),
        line(10, 14, 14, 14, s, w),
      ]);
    case 'personal':
      return svg(size, [
        circle(12, 8, 4, s, w),
        path('M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2', s, w),
      ]);
    case 'health':
      return svg(size, [
        path('M22 12h-4l-3 9L9 3l-3 9H2', s, w),
      ]);
    case 'finance':
      return svg(size, [
        line(12, 1, 12, 23, s, w),
        path('M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6', s, w),
      ]);
    case 'study':
      return svg(size, [
        path('M4 19.5A2.5 2.5 0 016.5 17H20', s, w),
        path('M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z', s, w),
      ]);
    case 'home':
      return svg(size, [
        path('M3 12L12 3l9 9', s, w),
        path('M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9', s, w),
      ]);
    case 'other':
      return svg(size, [
        path('M8 6h13', s, w), line(8, 12, 21, 12, s, w), line(8, 18, 21, 18, s, w),
        path('M3 6h.01', s, w + 0.5), path('M3 12h.01', s, w + 0.5), path('M3 18h.01', s, w + 0.5),
      ]);

    // ── Logistics ─────────────────────────────────────────────────────────────
    case 'hotel':
      return svg(size, [
        path('M3 21h18', s, w),
        rect(4, 5, 16, 16, 0, s, w),
        rect(9, 14, 6, 7, 0, s, w),
        rect(7, 9, 3, 3, 0, s, w),
        rect(14, 9, 3, 3, 0, s, w),
      ]);
    case 'airplane':
      return svg(size, [
        path('M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z', s, w),
      ]);
    case 'van':
      return svg(size, [
        path('M1 3h15v13H1z', s, w),
        path('M16 8h4l3 3v5h-7V8z', s, w),
        circle(5.5, 18.5, 2.5, s, w),
        circle(18.5, 18.5, 2.5, s, w),
      ]);

    // ── Utility ───────────────────────────────────────────────────────────────
    case 'pin':
      return svg(size, [
        path('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z', s, w),
        circle(12, 10, 3, s, w),
      ]);
    case 'clock':
      return svg(size, [
        circle(12, 12, 10, s, w),
        path('M12 6v6l4 2', s, w),
      ]);
    case 'bell':
      return svg(size, [
        path('M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9', s, w),
        path('M13.73 21a2 2 0 01-3.46 0', s, w),
      ]);
    case 'tag':
      return svg(size, [
        path('M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z', s, w),
        path('M7 7h.01', s, w + 1),
      ]);
    case 'check':
      return svg(size, [
        path('M20 6L9 17l-5-5', s, w),
      ]);

    case 'bed':
      return svg(size, [
        path('M2 17v-4a2 2 0 012-2h16a2 2 0 012 2v4', s, w),
        path('M6 11V8a2 2 0 012-2h8a2 2 0 012 2v3', s, w),
        line(2, 17, 22, 17, s, w),
      ]);
    case 'people':
      return svg(size, [
        path('M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2', s, w),
        circle(9, 7, 4, s, w),
        path('M23 21v-2a4 4 0 00-3-3.87', s, w),
        path('M16 3.13a4 4 0 010 7.75', s, w),
      ]);
    case 'music':
      return svg(size, [
        path('M9 18V5l12-2v13', s, w),
        circle(6, 18, 3, s, w),
        circle(18, 16, 3, s, w),
      ]);
    case 'close':
      return svg(size, [
        path('M18 6L6 18', s, w),
        path('M6 6l12 12', s, w),
      ]);
    case 'chevronRight':
      return svg(size, [path('M9 18l6-6-6-6', s, w)]);
    case 'chevronDown':
      return svg(size, [path('M6 9l6 6 6-6', s, w)]);
    case 'chevronUp':
      return svg(size, [path('M18 15l-6-6-6 6', s, w)]);
    case 'plus':
      return svg(size, [path('M12 5v14', s, w), path('M5 12h14', s, w)]);
    case 'minus':
      return svg(size, [path('M5 12h14', s, w)]);
    case 'phone':
      return svg(size, [
        path('M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.71A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.91a16 16 0 006.18 6.18l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z', s, w),
      ]);
    case 'key':
      return svg(size, [
        path('M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4', s, w),
      ]);
    case 'refresh':
      return svg(size, [
        path('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', s, w),
        path('M3 3v5h5', s, w),
      ]);
    case 'mic':
      return svg(size, [
        rect(9, 2, 6, 12, 3, s, w),
        path('M5 10a7 7 0 0 0 14 0', s, w),
        line(12, 17, 12, 21, s, w),
        line(9, 21, 15, 21, s, w),
      ]);

    default:
      return React.createElement(Text as any, { style: { fontSize: size } }, EMOJI_FALLBACK[name] ?? '?');
  }
}

export function Icon({ name, color = '#fff', size = 16, fill }: Props) {
  if (Platform.OS !== 'web') {
    return React.createElement(
      Text as any,
      { style: { fontSize: size - 2, lineHeight: size + 2 } },
      EMOJI_FALLBACK[name] ?? '?',
    );
  }
  return renderIcon(name, color, size, fill);
}
