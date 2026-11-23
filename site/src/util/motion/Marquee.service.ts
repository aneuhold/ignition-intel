import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { MotionContext } from './MotionContext';

/**
 * Loops a band of text sideways. The band's `[data-marquee-track]` holds two identical
 * copies, so moving it left by half its width lands exactly where it started.
 */
class MarqueeService {
  /** Scroll velocity (px/s) that doubles the loop speed. */
  static readonly #VELOCITY_PER_SPEEDUP = 1200;

  /** Fastest the loop runs while the page scrolls, as a multiple of its resting speed. */
  static readonly #MAX_SPEED = 4;

  /**
   * Starts the loop. It runs only while the band is on screen, and speeds up briefly while
   * the page scrolls.
   *
   * @param band Element holding the `[data-marquee-track]`
   * @param context Shared motion tokens
   * @param context.tokens Durations and easings from `motion.css`
   */
  attach(band: HTMLElement, { tokens }: MotionContext): void {
    const track = band.querySelector('[data-marquee-track]');
    if (!track) return;
    const loop = gsap.to(track, {
      xPercent: -50,
      ease: 'none',
      repeat: -1,
      duration: tokens.marquee,
      paused: true
    });
    // Scroll velocity eases a proxy speed toward its target, and the loop follows the proxy.
    // One reusable quickTo tween, so scrolling allocates nothing new per update.
    const speed = { value: 1 };
    const speedTo = gsap.quickTo(speed, 'value', {
      duration: tokens.glide,
      ease: tokens.soft,
      onUpdate: () => {
        loop.timeScale(speed.value);
      }
    });
    ScrollTrigger.create({
      trigger: band,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: ({ isActive }) => {
        if (isActive) loop.play();
        else loop.pause();
      },
      onUpdate: (self) => {
        speedTo(
          Math.min(
            1 + Math.abs(self.getVelocity()) / MarqueeService.#VELOCITY_PER_SPEEDUP,
            MarqueeService.#MAX_SPEED
          )
        );
      }
    });
    gsap.context(() => {
      const settle = (): void => {
        speedTo(1);
      };
      ScrollTrigger.addEventListener('scrollEnd', settle);
      return () => {
        ScrollTrigger.removeEventListener('scrollEnd', settle);
      };
    });
  }
}

const marqueeService = new MarqueeService();
export default marqueeService;
