import { gsap } from 'gsap';
import motionTokensService from './MotionTokens.service';

/**
 * The scroll-told story in `[data-story]`. On wide screens with a fine pointer
 * the section pins
 * and scroll scrubs through its `[data-story-scene]` items one at a time while
 * the case visual updates. The markup is written in the story's final state
 * (what a visitor without JS or with reduced motion sees); this service sets
 * up the first scene and builds the timeline toward that state from data
 * attributes, each keyed by the scene number (2, 3, ...) it changes at:
 *
 * - `data-story-enter`: appears at that scene
 * - `data-story-exit`: disappears at that scene (written hidden in markup)
 * - `data-story-strike`: a strike line drawn across at that scene
 * - `data-story-move` with `data-story-dx` / `data-story-dy`: moves at that scene
 * - `data-story-meter` with `data-story-values`: comma-separated fill per scene (0 to 1)
 * - `data-story-tick`: one progress tick per scene, filled as it's reached
 *
 * Narrow screens and touch devices read the scenes as a plain list that fades
 * in as it scrolls, since a pin fights touch scrolling.
 */
class StoryService {
  /** Scrubbed timeline length, in scroll heights, given to each scene change. */
  static readonly #SCROLL_PER_SCENE = 0.9;

  /**
   * Attaches the story on the page, if there is one.
   */
  attach(): () => void {
    const section = document.querySelector<HTMLElement>('[data-story]');
    if (!section) return () => undefined;
    const matchMedia = gsap.matchMedia();

    matchMedia.add(
      {
        pin: '(min-width: 64rem) and (hover: hover) and (pointer: fine)',
        motion: '(prefers-reduced-motion: no-preference)'
      },
      (context) => {
        const { pin = false, motion = false } = context.conditions ?? {};
        if (!motion) return;
        if (pin) return this.#pin(section);
        for (const scene of gsap.utils.toArray<HTMLElement>('[data-story-scene]', section)) {
          gsap.from(scene, {
            autoAlpha: 0,
            y: 32,
            duration: motionTokensService.duration('slow'),
            ease: motionTokensService.ease('soft'),
            scrollTrigger: { trigger: scene, start: 'top 85%', once: true }
          });
        }
      }
    );

    return () => {
      matchMedia.revert();
    };
  }

  /**
   * Pins the section and scrubs through the scenes.
   *
   * @param section The story section
   */
  #pin(section: HTMLElement): () => void {
    const all = (selector: string): HTMLElement[] =>
      gsap.utils.toArray<HTMLElement>(selector, section);
    const scenes = all('[data-story-scene]');
    const ticks = all('[data-story-tick]');
    const meters = all('[data-story-meter]').map((meter) => ({
      meter,
      values: (meter.dataset.storyValues ?? '').split(',').map(Number)
    }));
    const header = document.querySelector('header');
    const sweep = motionTokensService.ease('sweep');

    section.dataset.story = 'pinned';
    gsap.set(scenes.slice(1), { autoAlpha: 0, y: 40 });
    gsap.set(all('[data-story-enter]'), { autoAlpha: 0 });
    gsap.set(all('[data-story-exit]'), { autoAlpha: 1 });
    gsap.set(all('[data-story-strike]'), { scaleX: 0, transformOrigin: 'left center' });
    gsap.set(ticks, {
      scaleX: (index: number) => (index === 0 ? 1 : 0),
      transformOrigin: 'left center'
    });
    for (const { meter, values } of meters) {
      gsap.set(meter, { clipPath: this.#fill(values[0] ?? 0) });
    }

    const timeline = gsap.timeline({
      defaults: { ease: sweep, duration: 0.4 },
      scrollTrigger: {
        trigger: section,
        start: () => `top ${header?.offsetHeight ?? 0}px`,
        end: () => `+=${window.innerHeight * StoryService.#SCROLL_PER_SCENE * (scenes.length - 1)}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true
      }
    });

    for (let scene = 2; scene <= scenes.length; scene++) {
      const at = scene - 1.5;
      const keyed = (attribute: string): HTMLElement[] =>
        all(`[data-story-${attribute}="${scene}"]`);
      const changes: [HTMLElement[], gsap.TweenVars, number][] = [
        [scenes.slice(scene - 2, scene - 1), { autoAlpha: 0, y: -40 }, at],
        [scenes.slice(scene - 1, scene), { autoAlpha: 1, y: 0 }, at + 0.15],
        [keyed('enter'), { autoAlpha: 1, stagger: 0.08 }, at],
        [keyed('exit'), { autoAlpha: 0, duration: 0.3 }, at],
        [keyed('strike'), { scaleX: 1, duration: 0.3 }, at + 0.1],
        [ticks.slice(scene - 1, scene), { scaleX: 1, duration: 0.3 }, at]
      ];
      for (const [targets, vars, position] of changes) {
        if (targets.length > 0) timeline.to(targets, vars, position);
      }
      for (const element of keyed('move')) {
        timeline.to(
          element,
          { x: Number(element.dataset.storyDx), y: Number(element.dataset.storyDy) },
          at
        );
      }
      for (const { meter, values } of meters) {
        timeline.to(meter, { clipPath: this.#fill(values[scene - 1] ?? 0) }, at);
      }
    }
    // Rest on the last scene before the pin lets go.
    timeline.to({}, { duration: 0.6 });

    return () => {
      delete section.dataset.story;
    };
  }

  /**
   * A clip-path that shows the leading share of a meter.
   *
   * @param share How full the meter is, 0 to 1
   */
  #fill(share: number): string {
    return `inset(0% ${((1 - share) * 100).toFixed(1)}% 0% 0%)`;
  }
}

const storyService = new StoryService();
export default storyService;
