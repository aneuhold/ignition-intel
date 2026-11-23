import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import motionTokensService from './MotionTokens.service';

/**
 * Choreographs client-router navigations. The header and footer stay still;
 * the outgoing `[data-page-main]` lifts away while a gold line sweeps across
 * under the header (`[data-transition-bar]`), then the new content rises in
 * as the line clears. Astro's own view-transition animation is turned off in
 * `motion.css`. With reduced motion, pages swap instantly.
 */
class PageTransitionService {
  #navigating = false;

  /**
   * Registers the navigation listeners. Call once.
   */
  attach(): void {
    document.addEventListener('astro:before-preparation', (event) => {
      if (!this.#motionWelcome()) return;
      this.#navigating = true;
      const { loader } = event;
      event.loader = async () => {
        await Promise.all([loader(), this.#leave()]);
      };
    });
    document.addEventListener('astro:after-swap', () => {
      if (!this.#navigating) return;
      gsap.set('[data-page-main]', { autoAlpha: 0, y: 24 });
    });
    document.addEventListener('astro:page-load', () => {
      if (!this.#navigating) return;
      this.#navigating = false;
      this.#enter();
    });
  }

  /**
   * Lifts the current content away and draws the gold line in.
   */
  async #leave(): Promise<void> {
    const glide = motionTokensService.duration('glide');
    const sweep = motionTokensService.ease('sweep');
    await gsap
      .timeline()
      .to('[data-page-main]', { autoAlpha: 0, y: -16, duration: glide * 0.75, ease: sweep })
      .fromTo(
        '[data-transition-bar]',
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: glide, ease: sweep },
        0
      );
  }

  /**
   * Clears the gold line and brings the new content in, then lets
   * ScrollTrigger re-measure now that the content sits in its real place.
   */
  #enter(): void {
    const glide = motionTokensService.duration('glide');
    gsap
      .timeline()
      .to('[data-transition-bar]', {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: glide,
        ease: motionTokensService.ease('sweep')
      })
      .to(
        '[data-page-main]',
        {
          autoAlpha: 1,
          y: 0,
          duration: motionTokensService.duration('slow'),
          ease: motionTokensService.ease('soft'),
          clearProps: 'transform,opacity,visibility',
          onComplete: () => {
            ScrollTrigger.refresh();
          }
        },
        glide * 0.2
      );
  }

  /**
   * Whether the visitor is fine with motion.
   */
  #motionWelcome(): boolean {
    return window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  }
}

const pageTransitionService = new PageTransitionService();
export default pageTransitionService;
