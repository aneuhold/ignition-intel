import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
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
   * Attaches every effect whose markup is on the current page. The intro, when
   * it plays, holds back the hero heading, embers, and flicker until the logo
   * has lit.
   */
  async #start(): Promise<void> {
    this.#stop();
    const generation = this.#generation;
    const has = (selector: string): boolean => document.querySelector(selector) !== null;
    // Reveals start right away; only the hero heading waits on the intro's cue.
    let releaseCue = (): void => undefined;
    const cue = new Promise<void>((resolve) => {
      releaseCue = resolve;
    });
    this.#cleanups = [revealService.attach(cue), magneticService.attach()];

    const [intro, embers, flicker, story, courseGrid] = await Promise.all([
      has('[data-intro-overlay]') ? import('./Intro.service') : undefined,
      has('[data-ember-field]') ? import('./EmberField.service') : undefined,
      has('[data-flicker]') ? import('./FlameFlicker.service') : undefined,
      has('[data-story]') ? import('./Story.service') : undefined,
      has('[data-course-grid]') ? import('./CourseGrid.service') : undefined
    ]);
    if (generation !== this.#generation) return;

    const introHandle = intro?.default.attach();
    this.#cleanups.push(
      ...[
        introHandle?.detach,
        embers?.default.attach(cue),
        flicker?.default.attach(cue),
        story?.default.attach(),
        courseGrid?.default.attach()
      ].filter((cleanup) => cleanup !== undefined)
    );
    await introHandle?.cue;
    releaseCue();
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
