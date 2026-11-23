import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import motionTokensService from './MotionTokens.service';

/**
 * A slow flicker on `[data-flicker]` elements: the flame stretches and leans
 * a little from its base, and its `[data-flicker-glow]` breathes. Transforms
 * and opacity only, so it stays on the compositor. Pauses while off screen;
 * skipped under reduced motion.
 */
class FlameFlickerService {
  /**
   * Starts the flicker once the cue settles.
   *
   * @param cue Settles when the hero is ready (after the home intro, or at once)
   */
  attach(cue: Promise<void>): () => void {
    const flames = gsap.utils.toArray<HTMLElement>('[data-flicker]');
    if (flames.length === 0) return () => undefined;
    let attached = true;
    const matchMedia = gsap.matchMedia();

    void (async () => {
      await cue;
      if (!attached) return;
      matchMedia.add('(prefers-reduced-motion: no-preference)', () => {
        const cinema = motionTokensService.duration('cinema');
        const flicker = gsap
          .timeline({ repeat: -1, yoyo: true, defaults: { ease: 'sine.inOut' } })
          .fromTo(
            flames,
            { scaleY: 1, skewX: -0.8, transformOrigin: '50% 100%' },
            { scaleY: 1.03, skewX: 0.8, duration: cinema * 1.5 }
          )
          .fromTo(
            gsap.utils.toArray<HTMLElement>('[data-flicker-glow]'),
            { opacity: 0.75 },
            { opacity: 1, duration: cinema },
            0
          );
        ScrollTrigger.create({
          trigger: flames[0],
          start: 'top bottom',
          end: 'bottom top',
          onToggle: ({ isActive }) => {
            if (isActive) flicker.resume();
            else flicker.pause();
          }
        });
      });
    })();

    return () => {
      attached = false;
      matchMedia.revert();
    };
  }
}

const flameFlickerService = new FlameFlickerService();
export default flameFlickerService;
