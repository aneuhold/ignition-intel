import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import motionTokensService from './MotionTokens.service';

/**
 * One-time entrances driven by data attributes:
 * - `[data-split="load" | "scroll"]` headings rise in line by line behind a mask
 * - `[data-reveal]` blocks fade up as they scroll into view
 * - `[data-count]` numbers count up to their value the first time they're seen
 *
 * Nothing repeats on scroll back. With reduced motion nothing is touched and
 * the content stays in its final state.
 */
class RevealService {
  /** How far down the viewport an element's top must reach before it reveals. */
  static readonly #START = 'top 88%';

  /**
   * Attaches every reveal on the page.
   *
   * @param cue Settles when `load` headings may start (after the home intro, or at once)
   */
  attach(cue: Promise<void>): () => void {
    let attached = true;
    let released = false;
    const waiting: gsap.core.Tween[] = [];
    const matchMedia = gsap.matchMedia();

    matchMedia.add('(prefers-reduced-motion: no-preference)', (context) => {
      const slow = motionTokensService.duration('slow');
      const soft = motionTokensService.ease('soft');

      // Lines can only be measured once the web fonts are in.
      void (async () => {
        await document.fonts.ready;
        if (!attached) return;
        context.add(() => {
          for (const heading of gsap.utils.toArray<HTMLElement>('[data-split]')) {
            const onLoad = heading.dataset.split === 'load';
            const tween = this.#splitReveal(heading, onLoad && !released);
            if (onLoad && !released) waiting.push(tween);
          }
        });
      })();

      const blocks = gsap.utils.toArray<HTMLElement>('[data-reveal]');
      gsap.set(blocks, { autoAlpha: 0, y: 32 });
      ScrollTrigger.batch(blocks, {
        start: RevealService.#START,
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: slow, ease: soft, stagger: 0.08 })
      });

      for (const counter of gsap.utils.toArray<HTMLElement>('[data-count]')) {
        this.#countUp(counter);
      }
    });

    void (async () => {
      await cue;
      if (!attached) return;
      released = true;
      for (const tween of waiting) tween.play();
    })();

    return () => {
      attached = false;
      matchMedia.revert();
    };
  }

  /**
   * Splits a heading into masked lines and raises them into view. The split
   * is reverted once the lines are in, so the heading rewraps normally on
   * resize.
   *
   * @param heading The heading to reveal
   * @param paused Whether to wait for an explicit `play()`
   */
  #splitReveal(heading: HTMLElement, paused: boolean): gsap.core.Tween {
    const split = SplitText.create(heading, { type: 'lines', mask: 'lines' });
    gsap.set(heading, { visibility: 'visible' });
    return gsap.from(split.lines, {
      yPercent: 110,
      duration: motionTokensService.duration('slow'),
      ease: motionTokensService.ease('soft'),
      stagger: 0.08,
      paused,
      scrollTrigger:
        paused || heading.dataset.split === 'load'
          ? undefined
          : { trigger: heading, start: RevealService.#START, once: true },
      onComplete: () => {
        split.revert();
      }
    });
  }

  /**
   * Counts a number up from zero when it first scrolls into view, keeping its
   * thousands separator and any suffix (`data-count-suffix`).
   *
   * @param counter Element whose `data-count` holds the final number
   */
  #countUp(counter: HTMLElement): void {
    const end = Number(counter.dataset.count);
    const suffix = counter.dataset.countSuffix ?? '';
    const final = counter.textContent;
    const value = { current: 0 };
    gsap.to(value, {
      current: end,
      duration: motionTokensService.duration('cinema'),
      ease: 'power2.out',
      scrollTrigger: { trigger: counter, start: RevealService.#START, once: true },
      onStart: () => {
        counter.textContent = `0${suffix}`;
      },
      onUpdate: () => {
        counter.textContent = `${Math.round(value.current).toLocaleString('en-US')}${suffix}`;
      },
      onComplete: () => {
        counter.textContent = final;
      }
    });
  }
}

const revealService = new RevealService();
export default revealService;
