import { Platform } from 'react-native';

// GSAP is DOM-only; import lazily so native bundle never loads it.
let gsap: typeof import('gsap').gsap | null = null;
if (Platform.OS === 'web') {
  // Dynamic require so Metro/native build doesn't choke
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  gsap = require('gsap').gsap;
}

export { gsap };

/** Animate entrance of a DOM element ref (web only, no-op otherwise). */
export function entranceFrom(
  el: any,
  from: Record<string, unknown>,
  vars: Record<string, unknown> = {},
) {
  if (!gsap || !el) return;
  gsap.from(el, { ...from, ...vars });
}

/** Animate a DOM element ref to given props (web only). */
export function animateTo(
  el: any,
  to: Record<string, unknown>,
  vars: Record<string, unknown> = {},
) {
  if (!gsap || !el) return;
  gsap.to(el, { ...to, ...vars });
}

/** Staggered entrance for a list of DOM refs (web only). */
export function staggerEntrance(
  els: any[],
  from: Record<string, unknown>,
  stagger = 0.06,
  vars: Record<string, unknown> = {},
) {
  if (!gsap || els.length === 0) return;
  gsap.from(els.filter(Boolean), { ...from, stagger, ...vars });
}
