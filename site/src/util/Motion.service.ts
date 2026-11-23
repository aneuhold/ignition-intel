import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(CustomEase, DrawSVGPlugin, ScrollTrigger);

/**
 * Motion values read from the `motion.css` tokens, converted for GSAP: durations in
 * seconds and easings as registered GSAP ease names.
 */
export interface MotionTokens {
  snap: number;
  glide: number;
  slow: number;
  draw: number;
  /** GSAP ease name for `--ease-soft`. */
  soft: string;
  /** GSAP ease name for `--ease-draft`. */
  draft: string;
}

/**
 * Shared GSAP setup: registers the plugins once, turns the `motion.css` tokens into GSAP
 * durations and eases, and ties animation lifecycles to Astro's client router so every
 * animation starts on `astro:page-load` and is reverted on `astro:before-swap`.
 */
class MotionService {
  /** Media query every animation is gated on. With reduced motion nothing animates. */
  static readonly #ALLOWED = '(prefers-reduced-motion: no-preference)';

  #tokens: MotionTokens | null = null;

  /**
   * The media query animations are gated on, for `gsap.matchMedia().add()`.
   */
  get allowedQuery(): string {
    return MotionService.#ALLOWED;
  }

  /**
   * Durations and eases from the `motion.css` tokens. Read once, on first use.
   */
  tokens(): MotionTokens {
    if (this.#tokens) return this.#tokens;
    const style = getComputedStyle(document.documentElement);
    this.#tokens = {
      snap: this.#seconds(style, '--duration-snap'),
      glide: this.#seconds(style, '--duration-glide'),
      slow: this.#seconds(style, '--duration-slow'),
      draw: this.#seconds(style, '--duration-draw'),
      soft: this.#ease(style, '--ease-soft', 'soft'),
      draft: this.#ease(style, '--ease-draft', 'draft')
    };
    return this.#tokens;
  }

  /**
   * Runs `attach` on every page load and calls the cleanup it returns before the next
   * page swaps in. `attach` returns `null` when the current page has nothing for it.
   *
   * @param attach Starts animations for the current page and returns their cleanup
   */
  bindToPage(attach: () => (() => void) | null): void {
    let cleanup: (() => void) | null = null;
    document.addEventListener('astro:page-load', () => {
      cleanup?.();
      cleanup = attach();
    });
    document.addEventListener('astro:before-swap', () => {
      cleanup?.();
      cleanup = null;
    });
  }

  /**
   * Parses a CSS duration token (`150ms` or `0.15s`) into seconds.
   *
   * @param style Computed style of the root element
   * @param name Custom property name
   */
  #seconds(style: CSSStyleDeclaration, name: string): number {
    const raw = style.getPropertyValue(name).trim();
    const value = parseFloat(raw);
    if (Number.isNaN(value)) return 0.4;
    return raw.endsWith('ms') ? value / 1000 : value;
  }

  /**
   * Registers a `cubic-bezier()` easing token as a GSAP CustomEase and returns its name.
   *
   * @param style Computed style of the root element
   * @param name Custom property name
   * @param easeName Name to register the ease under
   */
  #ease(style: CSSStyleDeclaration, name: string, easeName: string): string {
    const match = /cubic-bezier\(([^)]+)\)/.exec(style.getPropertyValue(name));
    if (!match) return 'power2.inOut';
    CustomEase.create(easeName, match[1].replace(/\s+/g, ''));
    return easeName;
  }
}

const motionService = new MotionService();
export default motionService;
