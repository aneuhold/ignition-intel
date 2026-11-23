import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import motionTokensService from './MotionTokens.service';

/**
 * Course panels in a `[data-course-grid]`. On wide screens the panels sit in
 * one row and the active one (`data-active`) opens into a preview; hovering or
 * focusing another panel hands the preview over, animated with Flip. Every
 * panel has a heat glow that follows a fine pointer. Narrow screens stack the
 * panels fully open with no hand-off.
 */
class CourseGridService {
  /** Hover has to rest this long, in seconds, before a panel opens, so sweeping across doesn't flicker. */
  static readonly #HOVER_INTENT = 0.08;

  constructor() {
    gsap.registerPlugin(Flip);
  }

  /**
   * Attaches every course grid on the page.
   */
  attach(): () => void {
    const grids = gsap.utils.toArray<HTMLElement>('[data-course-grid]');
    if (grids.length === 0) return () => undefined;
    const matchMedia = gsap.matchMedia();

    matchMedia.add(
      {
        wide: '(min-width: 64rem)',
        motion: '(prefers-reduced-motion: no-preference)',
        finePointer: '(hover: hover) and (pointer: fine)'
      },
      (context) => {
        const { wide = false, motion = false, finePointer = false } = context.conditions ?? {};
        const cleanups = grids.flatMap((grid) => {
          const cards = gsap.utils.toArray<HTMLElement>('[data-course-card]', grid);
          return [
            ...(wide ? [this.#handOff(cards, motion)] : []),
            ...(finePointer && motion ? cards.map((card) => this.#glow(card)) : [])
          ];
        });
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
   * Opens a panel on hover or focus and closes the one that was open.
   *
   * @param cards The panels in one grid
   * @param animate Whether to animate the hand-off with Flip
   */
  #handOff(cards: HTMLElement[], animate: boolean): () => void {
    let pending: gsap.core.Tween | undefined;
    const open = (card: HTMLElement): void => {
      const current = cards.find((candidate) => candidate.hasAttribute('data-active'));
      if (current === card) return;
      const state = animate ? Flip.getState(cards) : undefined;
      current?.removeAttribute('data-active');
      card.setAttribute('data-active', '');
      if (!state) return;
      const glide = motionTokensService.duration('glide');
      const soft = motionTokensService.ease('soft');
      Flip.from(state, { duration: glide, ease: soft, scale: false, nested: true });
      gsap.fromTo(
        card.querySelectorAll('[data-course-preview]'),
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: glide, ease: soft, delay: glide * 0.35 }
      );
      if (current) {
        gsap.fromTo(
          current.querySelectorAll('[data-course-spine]'),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: glide, ease: soft, delay: glide * 0.5 }
        );
      }
    };

    const listeners = cards.map((card) => {
      const enter = ({ pointerType }: PointerEvent): void => {
        if (pointerType === 'touch') return;
        pending?.kill();
        pending = gsap.delayedCall(CourseGridService.#HOVER_INTENT, () => {
          open(card);
        });
      };
      const leave = (): void => {
        pending?.kill();
      };
      const focus = (): void => {
        open(card);
      };
      card.addEventListener('pointerenter', enter);
      card.addEventListener('pointerleave', leave);
      card.addEventListener('focusin', focus);
      return () => {
        card.removeEventListener('pointerenter', enter);
        card.removeEventListener('pointerleave', leave);
        card.removeEventListener('focusin', focus);
      };
    });

    return () => {
      pending?.kill();
      for (const remove of listeners) remove();
    };
  }

  /**
   * Moves a panel's `[data-course-glow]` toward the pointer with transforms,
   * so following the pointer never repaints the panel.
   *
   * @param card The panel
   */
  #glow(card: HTMLElement): () => void {
    const glow = card.querySelector('[data-course-glow]');
    if (!glow) return () => undefined;
    const follow = { duration: motionTokensService.duration('glide'), ease: 'power3.out' };
    const glowX = gsap.quickTo(glow, 'x', follow);
    const glowY = gsap.quickTo(glow, 'y', follow);
    // The glow rests at 70% across the bottom edge; offsets are measured from there.
    const move = ({ clientX, clientY }: PointerEvent): void => {
      const { left, top, width, height } = card.getBoundingClientRect();
      glowX(clientX - left - width * 0.7);
      glowY(clientY - top - height);
    };
    card.addEventListener('pointermove', move);
    return () => {
      card.removeEventListener('pointermove', move);
    };
  }
}

const courseGridService = new CourseGridService();
export default courseGridService;
