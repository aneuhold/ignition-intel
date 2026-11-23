import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import introService from './Intro.service';
import magneticService from './Magnetic.service';
import pageTransitionService from './PageTransition.service';
import revealService from './Reveal.service';

/**
 * Starts and stops every GSAP effect on the site. Effects attach on Astro's
 * `astro:page-load` and are reverted on `astro:before-swap`, so each page
 * shown by the client router gets fresh tweens and ScrollTriggers. Reveals,
 * magnetic buttons, and page transitions run everywhere; the heavier effects
 * (and the GSAP plugins they need) are only downloaded on pages whose markup
 * asks for them.
 */
class MotionService {
  /** Minimum wait, in ms, before loading the heavier effects, so the first reveals paint first. */
  static readonly #SETTLE_MS = 1000;

  /** Longest further wait, in ms, for an idle moment after that. */
  static readonly #IDLE_TIMEOUT_MS = 1000;

  #initialized = false;
  #cleanups: (() => void)[] = [];
  /** Bumped on every start and stop, so an async start that's been overtaken gives up. */
  #generation = 0;

  /**
   * Registers the shared GSAP plugins and the page lifecycle listeners. Safe
   * to call more than once.
   */
  init(): void {
    if (this.#initialized) return;
    this.#initialized = true;
    gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText);
    pageTransitionService.attach();
    document.addEventListener('astro:page-load', () => {
      void this.#start();
    });
    document.addEventListener('astro:before-swap', () => {
      this.#stop();
    });
  }

  /**
   * Attaches every effect whose markup is on the current page.
   */
  async #start(): Promise<void> {
    this.#stop();
    const generation = this.#generation;
    const has = (selector: string): boolean => document.querySelector(selector) !== null;
    // The intro is small and must start at once, so it isn't lazy loaded. The
    // hero heading, embers, and flicker wait on its cue; everything else starts now.
    const { cue, detach } = introService.attach();
    this.#cleanups = [detach, revealService.attach(cue), magneticService.attach()];

    // The rest are decoration: fetch them once the page has settled.
    await this.#idle();
    if (generation !== this.#generation) return;
    const [embers, flicker, story, courseGrid] = await Promise.all([
      has('[data-ember-field]') ? import('./EmberField.service') : undefined,
      has('[data-flicker]') ? import('./FlameFlicker.service') : undefined,
      has('[data-story]') ? import('./Story.service') : undefined,
      has('[data-course-grid]') ? import('./CourseGrid.service') : undefined
    ]);
    if (generation !== this.#generation) return;
    this.#cleanups.push(
      ...[
        embers?.default.attach(cue),
        flicker?.default.attach(cue),
        story?.default.attach(),
        courseGrid?.default.attach()
      ].filter((cleanup) => cleanup !== undefined)
    );
  }

  /**
   * Resolves once the page has had a moment to settle and the browser is
   * idle (where `requestIdleCallback` is supported).
   */
  async #idle(): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, MotionService.#SETTLE_MS);
    });
    await new Promise<void>((resolve) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(
          () => {
            resolve();
          },
          { timeout: MotionService.#IDLE_TIMEOUT_MS }
        );
      } else {
        resolve();
      }
    });
  }

  /**
   * Reverts every effect attached for the current page.
   */
  #stop(): void {
    this.#generation++;
    for (const cleanup of this.#cleanups) cleanup();
    this.#cleanups = [];
  }
}

const motionService = new MotionService();
export default motionService;
