import { gsap } from 'gsap';
import type { MotionContext } from './MotionContext';

/**
 * Turns the course rail into a pinned horizontal scroll on desktop: the section holds still
 * while vertical scrolling slides `[data-rail-track]` left through `[data-rail-viewport]`,
 * and `[data-rail-progress]` fills to match. On smaller screens the rail stays a plain
 * vertical stack; on wide touch screens it scrolls sideways natively.
 */
class CourseRailService {
  /**
   * Pins the rail and ties its sideways travel to scroll.
   *
   * @param section The section to pin
   * @param context Shared motion tokens and breakpoint
   * @param context.desktop Whether the viewport is wide with a fine pointer
   */
  attach(section: HTMLElement, { desktop }: MotionContext): void {
    const viewport = section.querySelector<HTMLElement>('[data-rail-viewport]');
    const track = section.querySelector<HTMLElement>('[data-rail-track]');
    if (!desktop || !viewport || !track) return;
    const distance = (): number => Math.max(0, track.scrollWidth - viewport.clientWidth);
    if (distance() === 0) return;

    // Without JS the viewport scrolls natively. Pinned, it clips instead, so focusing a card
    // can't scroll it out from under the transform.
    gsap.set(viewport, { overflowX: 'clip' });
    const rail = gsap
      .timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          pin: true,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.4,
          invalidateOnRefresh: true
        }
      })
      .to(track, { x: () => -distance() })
      .fromTo(section.querySelectorAll('[data-rail-progress]'), { scaleX: 0 }, { scaleX: 1 }, 0);

    // Tabbing to a card off to the side scrolls the page to where the rail shows it.
    const reveal = ({ target }: FocusEvent): void => {
      const card =
        target instanceof HTMLElement ? target.closest<HTMLElement>('[data-rail-card]') : null;
      const trigger = rail.scrollTrigger;
      if (!card || !trigger) return;
      const progress = gsap.utils.clamp(0, 1, card.offsetLeft / distance());
      window.scrollTo({ top: trigger.start + progress * (trigger.end - trigger.start) });
    };
    gsap.context(() => {
      track.addEventListener('focusin', reveal);
      return () => {
        track.removeEventListener('focusin', reveal);
      };
    });
  }
}

const courseRailService = new CourseRailService();
export default courseRailService;
