import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import motionTokensService from './MotionTokens.service';

/**
 * What {@link IntroService.attach} hands back: a promise that settles when
 * the hero should start revealing, and a function that tears the intro down.
 */
export interface IntroHandle {
  cue: Promise<void>;
  detach: () => void;
}

/**
 * The home page's first-visit intro. A spark rises through the flame mark as
 * its strokes draw in, the mark fills with gold, then glides into its place in
 * the hero while the backdrop clears. Runs only when the inline script in
 * `BaseLayout.astro` set `html[data-intro]`. Any scroll, click, touch, or key
 * fast-forwards it.
 */
class IntroService {
  /** How much faster the intro runs once the visitor asks to skip it. */
  static readonly #SKIP_TIME_SCALE = 6;

  /** Events that count as asking to skip. */
  static readonly #SKIP_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

  constructor() {
    gsap.registerPlugin(DrawSVGPlugin);
  }

  /**
   * Plays the intro if this visit calls for it.
   */
  attach(): IntroHandle {
    const root = document.documentElement;
    const overlay = document.querySelector<HTMLElement>('[data-intro-overlay]');
    const target = document.querySelector<HTMLElement>('[data-intro-target]');
    const mark = overlay?.querySelector<HTMLElement>('[data-intro-mark]');
    const skipped: IntroHandle = { cue: Promise.resolve(), detach: () => undefined };
    if (!('intro' in root.dataset) || !overlay || !target || !mark) return skipped;
    // A reload that restores a scrolled position has nothing to show the intro on.
    if (window.scrollY > window.innerHeight / 3) {
      delete root.dataset.intro;
      return skipped;
    }

    let releaseCue = (): void => undefined;
    const cue = new Promise<void>((resolve) => {
      releaseCue = resolve;
    });
    const finish = (): void => {
      delete root.dataset.intro;
      releaseCue();
    };

    let timeline: gsap.core.Timeline | undefined;
    const context = gsap.context(() => {
      timeline = this.#build(overlay, mark, target, releaseCue, finish);
    });
    const skip = (): void => {
      timeline?.timeScale(IntroService.#SKIP_TIME_SCALE);
    };
    for (const type of IntroService.#SKIP_EVENTS) {
      window.addEventListener(type, skip, { passive: true, once: true });
    }

    return {
      cue,
      detach: () => {
        for (const type of IntroService.#SKIP_EVENTS) window.removeEventListener(type, skip);
        context.revert();
        finish();
      }
    };
  }

  /**
   * Builds the intro timeline.
   *
   * @param overlay The full-screen intro layer
   * @param mark The flame mark inside the overlay
   * @param target The hero's own mark, where the overlay mark comes to rest
   * @param onCue Called when the hero heading should start revealing
   * @param onDone Called when the overlay is gone
   */
  #build(
    overlay: HTMLElement,
    mark: HTMLElement,
    target: HTMLElement,
    onCue: () => void,
    onDone: () => void
  ): gsap.core.Timeline {
    const glide = motionTokensService.duration('glide');
    const slow = motionTokensService.duration('slow');
    const soft = motionTokensService.ease('soft');
    const sweep = motionTokensService.ease('sweep');
    const paths = [...mark.querySelectorAll<SVGPathElement>('[data-logo-path]')].sort(
      (a, b) => Number(a.dataset.logoPath) - Number(b.dataset.logoPath)
    );
    const spark = overlay.querySelector('[data-intro-spark]');
    const glow = overlay.querySelector('[data-intro-glow]');
    const backdrop = overlay.querySelector('[data-intro-backdrop]');
    // Where the overlay mark has to travel to sit exactly on the hero mark.
    const handOff = (): { x: number; y: number; scale: number } => {
      const from = mark.getBoundingClientRect();
      const to = target.getBoundingClientRect();
      return {
        x: to.left + to.width / 2 - (from.left + from.width / 2),
        y: to.top + to.height / 2 - (from.top + from.height / 2),
        scale: to.height / from.height
      };
    };

    // The failsafe CSS animation would otherwise hide the overlay mid-show.
    gsap.set(overlay, { animation: 'none' });
    gsap.set(target, { autoAlpha: 0 });
    gsap.set(paths, { drawSVG: '0% 0%', strokeWidth: 1.5, fillOpacity: 0 });

    return gsap
      .timeline({
        defaults: { ease: soft },
        onComplete: () => {
          gsap.set(target, { autoAlpha: 1 });
          gsap.set(overlay, { autoAlpha: 0 });
          onDone();
        }
      })
      .fromTo(spark, { scale: 0, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: glide * 0.5 })
      .to(paths, { drawSVG: '0% 100%', duration: slow * 0.8, stagger: 0.08, ease: sweep }, '<0.1')
      .to(
        spark,
        {
          y: () => -mark.getBoundingClientRect().height * 0.85,
          scale: 0.4,
          autoAlpha: 0,
          duration: slow,
          ease: 'power1.in'
        },
        '<'
      )
      .to(paths, { fillOpacity: 1, duration: glide, stagger: 0.04 }, `-=${glide * 0.6}`)
      .to(paths, { strokeWidth: 0, duration: glide }, '<')
      .fromTo(glow, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: glide }, '<')
      .call(onCue)
      .to(mark, { ...handOff(), duration: slow, ease: sweep }, '<0.15')
      .to([glow, backdrop], { autoAlpha: 0, duration: slow, ease: sweep }, '<');
  }
}

const introService = new IntroService();
export default introService;
