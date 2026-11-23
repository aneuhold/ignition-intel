import { gsap } from 'gsap';
import type { MotionContext } from './MotionContext';

/**
 * Effects built on the V-pattern clip-path utilities in `shapes.css`. Each tweens the
 * progress variable its utility reads, from 0 up to the resting value of 1.
 */
class VPatternService {
  /**
   * Grows the layers of a V-pattern graphic up and out from their shared apex, outermost
   * first, then brings in the origin marker.
   *
   * @param graphic Element holding `[data-v-layer]` layers and an optional `[data-v-origin]`
   * @param context Shared motion tokens
   * @param context.tokens Durations and easings from `motion.css`
   */
  burn(graphic: HTMLElement, { tokens }: MotionContext): void {
    const layers = graphic.querySelectorAll('[data-v-layer]');
    const origin = graphic.querySelectorAll('[data-v-origin]');
    gsap
      .timeline({ defaults: { duration: tokens.slow, ease: tokens.burn } })
      .from(layers, { scaleY: 0, scaleX: 0.3, transformOrigin: '50% 100%', stagger: tokens.snap })
      .from(
        origin,
        { autoAlpha: 0, scale: 0.4, duration: tokens.glide, ease: tokens.soft },
        '<0.2'
      );
  }

  /**
   * Drops a V divider's apex down into the next section as it scrolls through the lower part
   * of the viewport, by scaling the wedge down from its top edge.
   *
   * @param divider Element using `clip-v` with `origin-top`
   */
  drop(divider: HTMLElement): void {
    gsap.fromTo(
      divider,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: { trigger: divider, start: 'top bottom', end: 'bottom 65%', scrub: true }
      }
    );
  }

  /**
   * Slides a `clip-v-tail` panel down over its section, V tail first, once the section
   * scrolls into view.
   *
   * @param panel Element using `clip-v-tail`, inside a section that clips overflow
   * @param context Shared motion tokens
   * @param context.tokens Durations and easings from `motion.css`
   */
  wipe(panel: HTMLElement, { tokens }: MotionContext): void {
    gsap.from(panel, {
      yPercent: -100,
      duration: tokens.slow,
      ease: tokens.burn,
      scrollTrigger: { trigger: panel.parentElement ?? panel, start: 'top 80%', once: true }
    });
  }

  /**
   * Raises a headline's `[data-heat-front]` from below the headline into place, scrubbed by
   * scroll, while its `[data-heat-fill]` copy counter-moves so the text stays put. Both are
   * transforms. Finishes before the headline reaches the middle of the viewport.
   *
   * @param headline Element holding the front and fill layers
   */
  heat(headline: HTMLElement): void {
    const front = headline.querySelector('[data-heat-front]');
    const fill = headline.querySelector('[data-heat-fill]');
    if (!front || !fill) return;
    // The front is 160% of the headline's height, the fill 100%: moving the front down by its
    // full height clears the headline, and the fill moves back up by the same distance.
    gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: headline, start: 'top 85%', end: 'bottom 50%', scrub: 0.3 }
      })
      .from(front, { yPercent: 100 })
      .from(fill, { yPercent: -160 }, 0);
  }
}

const vPatternService = new VPatternService();
export default vPatternService;
