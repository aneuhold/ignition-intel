import { gsap } from 'gsap';
import motionService from '$util/Motion.service';
import sceneDrawingService from '$util/SceneDrawing.service';

/**
 * Pins the method walkthrough on wide screens and scrubs it with scroll: each step in
 * turn becomes the active one while its annotation layer draws onto the scene diagram.
 * Scroll snaps to the end of each step so the diagram rests fully drawn for every step.
 *
 * Expects, inside the section: `[data-walkthrough-pin]` (the pinned wrapper), one
 * `[data-walkthrough-step]` and one `[data-walkthrough-layer]` per step, and an optional
 * `[data-walkthrough-progress]` rule.
 */
class MethodWalkthroughService {
  /** Viewport heights of scroll per step while pinned. */
  static readonly #SCROLL_PER_STEP = 0.55;

  /** Opacity of steps that are not the active one. */
  static readonly #INACTIVE_OPACITY = 0.3;

  /**
   * Only pin where the steps and diagram sit side by side and fit the viewport, and with a
   * mouse or trackpad: on touch screens a pinned, snapping section fights the swipe, so
   * they get the stepped list.
   */
  static readonly #PINNABLE = '(min-width: 64rem) and (min-height: 44rem) and (pointer: fine)';

  /** Timeline time each layer takes to draw, out of one unit per step. */
  static readonly #DRAW = 0.8;

  /**
   * Starts the pinned walkthrough and returns the cleanup that reverts it.
   *
   * @param section The walkthrough section
   */
  attach(section: HTMLElement): () => void {
    const tokens = motionService.tokens();
    const context = gsap.context(() => {
      gsap
        .matchMedia()
        .add(`${motionService.allowedQuery} and ${MethodWalkthroughService.#PINNABLE}`, () => {
          this.#build(section, tokens.draft);
        });
    }, section);
    return () => {
      context.revert();
    };
  }

  /**
   * Builds the scrubbed, pinned timeline.
   *
   * @param section The walkthrough section
   * @param ease Ease for snapping between steps
   */
  #build(section: HTMLElement, ease: string): void {
    const pin = section.querySelector<HTMLElement>('[data-walkthrough-pin]');
    const steps = gsap.utils.toArray<HTMLElement>('[data-walkthrough-step]');
    const layers = gsap.utils.toArray<SVGGElement>('[data-walkthrough-layer]');
    const progress = section.querySelector<HTMLElement>('[data-walkthrough-progress]');
    // A pinned section taller than the viewport would hide its last steps, so it stays a
    // plain stepped list instead.
    if (!pin || steps.length === 0 || pin.offsetHeight > window.innerHeight) return;

    const draw = MethodWalkthroughService.#DRAW;
    const timeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () =>
          `+=${steps.length * window.innerHeight * MethodWalkthroughService.#SCROLL_PER_STEP}`,
        pin,
        scrub: 0.4,
        snap: { snapTo: 'labels', duration: { min: 0.2, max: 0.5 }, delay: 0.08, ease },
        invalidateOnRefresh: true,
        // Setting a priority makes ScrollTrigger refresh in page order, so triggers below
        // this pin account for its spacer no matter which script created them first.
        refreshPriority: 1
      }
    });

    gsap.set(steps.slice(1), { opacity: MethodWalkthroughService.#INACTIVE_OPACITY });
    timeline.addLabel('start', 0);

    for (const [index, step] of steps.entries()) {
      const layer = layers.at(index);
      if (layer) {
        const { strokes, fades } = sceneDrawingService.partsOf(layer);
        if (strokes.length > 0) {
          timeline.from(
            strokes,
            { drawSVG: 0, duration: draw * 0.7, stagger: (draw * 0.3) / strokes.length },
            index
          );
        }
        if (fades.length > 0) {
          timeline.from(fades, { opacity: 0, duration: draw * 0.4 }, index + draw * 0.4);
        }
      }
      if (index > 0) {
        timeline
          .to(step, { opacity: 1, duration: draw * 0.3 }, index)
          .to(
            steps[index - 1],
            { opacity: MethodWalkthroughService.#INACTIVE_OPACITY, duration: draw * 0.3 },
            index
          );
      }
      timeline.addLabel(`step-${index + 1}`, index + draw);
    }

    if (progress) {
      timeline.fromTo(progress, { scaleY: 0 }, { scaleY: 1, duration: steps.length }, 0);
    }
  }
}

const methodWalkthroughService = new MethodWalkthroughService();
export default methodWalkthroughService;
