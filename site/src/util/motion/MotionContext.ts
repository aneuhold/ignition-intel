import type { MotionTokens } from './MotionTokens.service';

/**
 * What every motion effect receives when it attaches: the shared tokens and the current
 * breakpoint.
 */
export interface MotionContext {
  tokens: MotionTokens;
  /** True at the `lg` breakpoint (64rem) and wider with a fine pointer (mouse or trackpad). */
  desktop: boolean;
}

/**
 * Attaches one effect to one element. Effects run inside a GSAP context, so every tween,
 * ScrollTrigger, and split they create is reverted with it. Anything else (a DOM listener)
 * goes in a nested `gsap.context()` that returns its own cleanup.
 */
export type MotionAttach = (element: HTMLElement, context: MotionContext) => void;
