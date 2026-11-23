import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Motion values read from the CSS custom properties in `motion.css`, converted
 * to the units GSAP expects.
 */
interface MotionTokens {
  /** Seconds, from `--duration-slow`. */
  duration: number;
  /** Seconds between staggered items, from `--stagger-reveal`. */
  stagger: number;
  /** Pixels an item travels as it fades in, from `--distance-reveal`. */
  distance: number;
  /** A GSAP ease built from `--ease-soft`. */
  ease: string;
}

/**
 * The quiet scroll motion shared by every page, opt-in by data attribute:
 *
 * - `data-reveal`: the element fades up a short distance as it scrolls into
 *   view. Items entering together stagger.
 * - `data-rule`: a hairline draws from left to right as it scrolls into view.
 *
 * Only elements still below the viewport when the service attaches take part.
 * Whatever is already on screen stays as painted, so the first view never
 * waits on this script (or flickers when it arrives late on a slow device).
 * Everything runs only under `prefers-reduced-motion: no-preference`, and
 * content is visible until the service hides it, so the page reads the same
 * without JavaScript.
 */
class PageMotionService {
  static readonly #MOTION_QUERY = '(prefers-reduced-motion: no-preference)';

  static readonly #EASE_NAME = 'soft';

  /** Where an element's top must reach in the viewport before it reveals. */
  static readonly #REVEAL_START = 'top 92%';

  constructor() {
    gsap.registerPlugin(CustomEase, ScrollTrigger);
  }

  /**
   * Starts the entry motion for every marked element inside the root, and
   * returns the function that stops it and reverts every tween,
   * ScrollTrigger, and inline style it added.
   *
   * @param root The element whose descendants carry the motion attributes.
   */
  attach(root: HTMLElement): () => void {
    const media = gsap.matchMedia();
    media.add(
      PageMotionService.#MOTION_QUERY,
      () => {
        const tokens = this.#readTokens();
        // Read every position before the first style write.
        const reveals = this.#belowViewport('[data-reveal]');
        const rules = this.#belowViewport('[data-rule]');
        this.#revealOnEntry(reveals, tokens);
        this.#drawRules(rules, tokens);
      },
      root
    );
    return () => {
      media.revert();
    };
  }

  /**
   * Hides every reveal target below the viewport, then fades each group up as
   * it enters.
   *
   * @param targets Reveal targets still below the viewport.
   * @param tokens Motion values from `motion.css`.
   */
  #revealOnEntry(targets: HTMLElement[], tokens: MotionTokens): void {
    const { duration, stagger, distance, ease } = tokens;
    // Opacity rather than autoAlpha: a hidden target stays focusable, and
    // tabbing to it scrolls it into view, which reveals it.
    gsap.set(targets, { opacity: 0, y: distance });
    ScrollTrigger.batch(targets, {
      start: PageMotionService.#REVEAL_START,
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, { opacity: 1, y: 0, duration, ease, stagger, overwrite: true })
    });
  }

  /**
   * Collapses every marked hairline below the viewport to its left edge, then
   * draws it across as it enters.
   *
   * @param rules Hairlines still below the viewport.
   * @param tokens Motion values from `motion.css`.
   */
  #drawRules(rules: HTMLElement[], tokens: MotionTokens): void {
    const { duration, ease } = tokens;
    gsap.set(rules, { scaleX: 0, transformOrigin: 'left center' });
    ScrollTrigger.batch(rules, {
      start: PageMotionService.#REVEAL_START,
      once: true,
      onEnter: (batch) => gsap.to(batch, { scaleX: 1, duration: duration * 1.5, ease })
    });
  }

  /**
   * The elements matching a selector whose top is still below the viewport.
   * Reads every position in one pass, before any style is written.
   *
   * @param selector Selector text, scoped to the attached root.
   */
  #belowViewport(selector: string): HTMLElement[] {
    const fold = window.innerHeight;
    return gsap.utils
      .toArray<HTMLElement>(selector)
      .filter((element) => element.getBoundingClientRect().top >= fold);
  }

  /**
   * Reads the motion custom properties from the document root and converts
   * them for GSAP: CSS times to seconds, rem lengths to pixels, and the
   * `cubic-bezier()` curve to a registered CustomEase.
   */
  #readTokens(): MotionTokens {
    const style = getComputedStyle(document.documentElement);
    const read = (name: string) => style.getPropertyValue(name).trim();
    const rootFontSize = parseFloat(style.fontSize);
    const curve = /cubic-bezier\(([^)]+)\)/.exec(read('--ease-soft'))?.[1];
    if (curve) {
      CustomEase.create(PageMotionService.#EASE_NAME, curve);
    }
    return {
      duration: this.#toSeconds(read('--duration-slow')),
      stagger: this.#toSeconds(read('--stagger-reveal')),
      distance: parseFloat(read('--distance-reveal')) * rootFontSize,
      ease: curve ? PageMotionService.#EASE_NAME : 'power3.out'
    };
  }

  /**
   * Converts a CSS time (`700ms` or `0.7s`) to seconds.
   *
   * @param time A CSS time value.
   */
  #toSeconds(time: string): number {
    const value = parseFloat(time);
    return time.endsWith('ms') ? value / 1000 : value;
  }
}

const pageMotionService = new PageMotionService();
export default pageMotionService;
