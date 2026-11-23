import { gsap } from 'gsap';
import motionTokensService from './MotionTokens.service';

/**
 * Makes `[data-magnetic]` buttons lean toward the pointer while it's over
 * them, with their `[data-magnetic-label]` following a little further, then
 * spring back on leave. Only for a fine pointer with motion welcome.
 */
class MagneticService {
  /** How far the button follows the pointer, as a share of the offset from its center. */
  static readonly #PULL = 0.3;

  /** How far the label follows, on top of the button. */
  static readonly #LABEL_PULL = 0.15;

  /**
   * Attaches the pull to every magnetic button on the page.
   */
  attach(): () => void {
    const matchMedia = gsap.matchMedia();
    matchMedia.add(
      '(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)',
      () => {
        const cleanups = gsap.utils
          .toArray<HTMLElement>('[data-magnetic]')
          .map((button) => this.#magnetize(button));
        return () => {
          for (const cleanup of cleanups) cleanup();
        };
      }
    );
    return () => {
      matchMedia.revert();
    };
  }

  /**
   * Wires one button and returns the function that unwires it.
   *
   * @param button The magnetic element
   */
  #magnetize(button: HTMLElement): () => void {
    const label = button.querySelector('[data-magnetic-label]');
    const follow = { duration: motionTokensService.duration('glide'), ease: 'power3.out' };
    const buttonX = gsap.quickTo(button, 'x', follow);
    const buttonY = gsap.quickTo(button, 'y', follow);
    const labelX = label ? gsap.quickTo(label, 'x', follow) : undefined;
    const labelY = label ? gsap.quickTo(label, 'y', follow) : undefined;

    const move = ({ clientX, clientY }: PointerEvent): void => {
      const { left, top, width, height } = button.getBoundingClientRect();
      const dx = clientX - (left + width / 2);
      const dy = clientY - (top + height / 2);
      buttonX(dx * MagneticService.#PULL);
      buttonY(dy * MagneticService.#PULL);
      labelX?.(dx * MagneticService.#LABEL_PULL);
      labelY?.(dy * MagneticService.#LABEL_PULL);
    };
    const leave = (): void => {
      gsap.to([button, label], {
        x: 0,
        y: 0,
        duration: motionTokensService.duration('slow'),
        ease: 'elastic.out(1, 0.45)',
        overwrite: 'auto'
      });
    };

    button.addEventListener('pointermove', move);
    button.addEventListener('pointerleave', leave);
    return () => {
      button.removeEventListener('pointermove', move);
      button.removeEventListener('pointerleave', leave);
    };
  }
}

const magneticService = new MagneticService();
export default magneticService;
