import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Durations (seconds) and eases read from the motion tokens in `motion.css`.
 */
interface MotionTokens {
  slow: number;
  stamp: number;
  count: number;
  soft: string;
  settle: string;
  thunk: string;
}

/**
 * Scroll and entrance motion for the "field notes" pages. Markup opts in with
 * `data-motion` attributes, and `attach` wires every effect found under a root:
 *
 * - `intro`: fades and lifts in on load, in document order. Keep it off a
 *   page's heading, lead paragraph, and hero image: hiding the largest
 *   element on first paint delays Largest Contentful Paint.
 * - `tag`: evidence tags drop in as they enter the viewport and settle into
 *   their resting tilt.
 * - `count`: a number counts up from zero once, the first time it is seen.
 * - `stamp`: a stamp lands on its `stamp-surface` with a short overshoot.
 * - `tape`: a scene-tape band slides in from the left.
 *
 * Every effect runs only under `(prefers-reduced-motion: no-preference)`, and
 * hidden starting states are set here rather than in CSS, so content is fully
 * visible without JavaScript or with reduced motion.
 */
class SceneMotionService {
  static readonly #MOTION_OK = '(prefers-reduced-motion: no-preference)';

  /** How far into the viewport (from the top) an element must reach to trigger. */
  static readonly #TRIGGER_START = 'top 85%';

  /** Splits a counted number like `3,500+` into its digits and trailing text. */
  static readonly #COUNT_PATTERN = /^([\d,]+)(.*)$/;

  /** Creates the singleton and registers the GSAP plugins it uses. */
  constructor() {
    gsap.registerPlugin(ScrollTrigger, CustomEase);
  }

  /**
   * Starts every effect under a root element, and returns the function that
   * stops them and reverts every tween, ScrollTrigger, and inline style added.
   *
   * @param root The element whose `data-motion` descendants are animated
   */
  attach(root: HTMLElement): () => void {
    const mm = gsap.matchMedia();
    mm.add(
      SceneMotionService.#MOTION_OK,
      () => {
        const tokens = this.#readTokens();
        this.#intro(root, tokens);
        this.#tags(root, tokens);
        this.#stamps(root, tokens);
        this.#tape(root, tokens);
        return this.#counts(root, tokens);
      },
      root
    );
    return () => {
      mm.revert();
    };
  }

  /**
   * Lifts `intro` elements in, staggered in document order.
   *
   * @param root The element to search
   * @param tokens Motion tokens
   */
  #intro(root: HTMLElement, tokens: MotionTokens): void {
    const items = root.querySelectorAll('[data-motion="intro"]');
    if (items.length === 0) return;
    gsap.from(items, {
      autoAlpha: 0,
      y: 18,
      duration: tokens.slow,
      ease: tokens.soft,
      stagger: 0.08
    });
  }

  /**
   * Drops evidence tags in as they reach the viewport. Each starts lower and
   * tilted further than its resting angle (the CSS `rotate` on the tag), then
   * settles with a small overshoot. GSAP animates `transform`, which composes
   * with that `rotate`, so the resting tilt and hover state stay in CSS.
   *
   * @param root The element to search
   * @param tokens Motion tokens
   */
  #tags(root: HTMLElement, tokens: MotionTokens): void {
    const tags = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-motion="tag"]'));
    if (tags.length === 0) return;
    gsap.set(tags, {
      autoAlpha: 0,
      y: 56,
      rotation: (index: number) => (index % 2 === 0 ? -7 : 6)
    });
    ScrollTrigger.batch(tags, {
      start: SceneMotionService.#TRIGGER_START,
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          rotation: 0,
          duration: tokens.slow,
          ease: tokens.settle,
          stagger: 0.12,
          overwrite: true
        });
      }
    });
  }

  /**
   * Counts each `count` number up from zero the first time it enters the
   * viewport. Returns a cleanup that puts the original text back.
   *
   * @param root The element to search
   * @param tokens Motion tokens
   */
  #counts(root: HTMLElement, tokens: MotionTokens): () => void {
    const restores: (() => void)[] = [];
    for (const element of root.querySelectorAll<HTMLElement>('[data-motion="count"]')) {
      const original = element.textContent;
      const match = SceneMotionService.#COUNT_PATTERN.exec(original.trim());
      if (!match) continue;
      const [, digits, suffix] = match;
      const target = Number(digits.replaceAll(',', ''));
      const format = (value: number): string =>
        `${Math.round(value).toLocaleString('en-US')}${suffix}`;
      const counter = { value: 0 };
      element.textContent = format(0);
      restores.push(() => {
        element.textContent = original;
      });
      gsap.to(counter, {
        value: target,
        duration: tokens.count,
        ease: 'power2.out',
        onUpdate: () => {
          element.textContent = format(counter.value);
        },
        scrollTrigger: { trigger: element, start: SceneMotionService.#TRIGGER_START, once: true }
      });
    }
    return () => {
      for (const restore of restores) restore();
    };
  }

  /**
   * Lands each `stamp` from above the page: it shrinks onto the paper with a
   * hard overshoot, and the nearest `stamp-surface` jolts down a few pixels
   * as it hits.
   *
   * @param root The element to search
   * @param tokens Motion tokens
   */
  #stamps(root: HTMLElement, tokens: MotionTokens): void {
    for (const stamp of root.querySelectorAll<HTMLElement>('[data-motion="stamp"]')) {
      const surface = stamp.closest('[data-motion="stamp-surface"]');
      const timeline = gsap.timeline({
        scrollTrigger: { trigger: stamp, start: 'top 75%', once: true }
      });
      timeline.fromTo(
        stamp,
        { autoAlpha: 0, scale: 2.6, rotation: -6 },
        { autoAlpha: 1, scale: 1, rotation: 0, duration: tokens.stamp, ease: tokens.thunk }
      );
      if (surface) {
        timeline.to(
          surface,
          { y: 4, duration: tokens.stamp / 4, ease: 'power1.out', yoyo: true, repeat: 1 },
          `-=${tokens.stamp / 3}`
        );
      }
    }
  }

  /**
   * Slides each `tape` band in from the left when it reaches the viewport.
   *
   * @param root The element to search
   * @param tokens Motion tokens
   */
  #tape(root: HTMLElement, tokens: MotionTokens): void {
    for (const tape of root.querySelectorAll<HTMLElement>('[data-motion="tape"]')) {
      gsap.from(tape, {
        xPercent: -60,
        autoAlpha: 0,
        duration: tokens.slow * 1.5,
        ease: tokens.soft,
        scrollTrigger: { trigger: tape, start: 'top 95%', once: true }
      });
    }
  }

  /**
   * Reads the motion tokens off the document root, converting durations to
   * seconds and `cubic-bezier()` easings to registered GSAP eases.
   */
  #readTokens(): MotionTokens {
    const style = getComputedStyle(document.documentElement);
    const seconds = (name: string): number => {
      const raw = style.getPropertyValue(`--duration-${name}`).trim();
      const value = parseFloat(raw);
      return raw.endsWith('ms') ? value / 1000 : value;
    };
    const ease = (name: string): string => {
      const raw = style.getPropertyValue(`--ease-${name}`).trim();
      const points = /cubic-bezier\(([^)]+)\)/.exec(raw)?.[1];
      if (!points) return 'power2.out';
      const easeName = `token-${name}`;
      CustomEase.create(easeName, points.replaceAll(/\s+/g, ''));
      return easeName;
    };
    return {
      slow: seconds('slow'),
      stamp: seconds('stamp'),
      count: seconds('count'),
      soft: ease('soft'),
      settle: ease('settle'),
      thunk: ease('thunk')
    };
  }
}

const sceneMotionService = new SceneMotionService();
export default sceneMotionService;
