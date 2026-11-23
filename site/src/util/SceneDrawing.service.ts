import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import motionService from './Motion.service';

/**
 * Line-drawing entrances for the drafting motifs, driven by data attributes so markup
 * stays declarative:
 *
 * - `[data-draw]` on an SVG: each `[data-draw-step]` child draws in turn when the SVG
 *   scrolls into view. Strokes draw with DrawSVG; `text` and `[data-draw-fade]` fade in.
 * - `[data-frame]`: its `[data-edge]` hairlines (`top`, `right`, `bottom`, `left`) extend
 *   around the box like a pen tracing a title block.
 * - `[data-leader]`: a callout leader hairline extends toward its label from the side
 *   named by the attribute value (`left`, `right`, or `center`).
 *
 * Everything is gated on reduced motion, so content is in its final state without it.
 */
class SceneDrawingService {
  /** Stroked SVG shapes that DrawSVG can draw. */
  static readonly #STROKES = 'path, line, polyline, polygon, rect, circle, ellipse';

  /** Where an element must be in the viewport before it draws. */
  static readonly #START = 'top 85%';

  /**
   * Keeps triggers active to the end of the page, so content already scrolled past
   * (e.g. after a back navigation) still draws instead of staying hidden.
   */
  static readonly #END = 'max';

  /** Transform origin for each edge of a frame, so each edge draws clockwise. */
  static readonly #EDGE_ORIGINS: Record<string, string> = {
    top: 'left center',
    right: 'center top',
    bottom: 'right center',
    left: 'center bottom'
  };

  /**
   * Starts every drawing entrance inside `root` and returns the cleanup that reverts them.
   *
   * @param root Element to search for drawing targets
   */
  attach(root: HTMLElement): () => void {
    const tokens = motionService.tokens();
    const context = gsap.context(() => {
      gsap.matchMedia().add(motionService.allowedQuery, () => {
        for (const svg of gsap.utils.toArray<SVGSVGElement>('[data-draw]')) {
          this.#drawSvg(svg, tokens.draw, tokens.draft);
        }
        this.#drawFrames(tokens.glide, tokens.draft);
        this.#drawLeaders(tokens.glide, tokens.draft);
      });
    }, root);
    return () => {
      context.revert();
    };
  }

  /**
   * Splits an SVG group into the strokes DrawSVG draws and the parts that fade in instead:
   * `text`, anything inside `[data-draw-fade]`, and dashed strokes (DrawSVG draws with
   * `stroke-dasharray`, which would replace their dash pattern).
   *
   * @param group SVG group to split
   */
  partsOf(group: SVGElement): { strokes: SVGElement[]; fades: SVGElement[] } {
    const strokes: SVGElement[] = [];
    const fades: SVGElement[] = [...group.querySelectorAll<SVGElement>('text, [data-draw-fade]')];
    for (const shape of group.querySelectorAll<SVGElement>(SceneDrawingService.#STROKES)) {
      if (shape.closest('[data-draw-fade]')) continue;
      (shape.hasAttribute('stroke-dasharray') ? fades : strokes).push(shape);
    }
    return { strokes, fades };
  }

  /**
   * Builds a step-by-step line-drawing timeline for one SVG, played once on entry.
   *
   * @param svg The SVG holding `[data-draw-step]` groups
   * @param duration Seconds each step's strokes take to draw
   * @param ease Ease for the strokes
   */
  #drawSvg(svg: SVGSVGElement, duration: number, ease: string): void {
    const steps = svg.querySelectorAll<SVGElement>('[data-draw-step]');
    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease },
      scrollTrigger: {
        trigger: svg,
        start: SceneDrawingService.#START,
        end: SceneDrawingService.#END,
        once: true
      }
    });
    for (const [index, step] of [...steps].entries()) {
      const at = index === 0 ? 0 : '-=75%';
      const { strokes, fades } = this.partsOf(step);
      if (strokes.length > 0) {
        timeline.from(strokes, { drawSVG: 0, duration, stagger: duration * 0.08 }, at);
      }
      if (fades.length > 0) {
        timeline.from(
          fades,
          { opacity: 0, duration: duration * 0.5, stagger: duration * 0.05 },
          strokes.length > 0 ? '<+=40%' : at
        );
      }
    }
  }

  /**
   * Draws the edges of every `[data-frame]` as it enters, batched so a row of frames
   * draws together with a short stagger.
   *
   * @param duration Seconds each edge takes
   * @param ease Ease for the edges
   */
  #drawFrames(duration: number, ease: string): void {
    const frames = gsap.utils.toArray<HTMLElement>('[data-frame]');
    if (frames.length === 0) return;
    for (const edge of gsap.utils.toArray<HTMLElement>('[data-edge]')) {
      const side = edge.dataset.edge ?? 'top';
      const horizontal = side === 'top' || side === 'bottom';
      gsap.set(edge, {
        transformOrigin: SceneDrawingService.#EDGE_ORIGINS[side],
        [horizontal ? 'scaleX' : 'scaleY']: 0
      });
    }
    ScrollTrigger.batch(frames, {
      start: SceneDrawingService.#START,
      end: SceneDrawingService.#END,
      once: true,
      onEnter: (batch) => {
        for (const [index, frame] of batch.entries()) {
          const edges = ['top', 'right', 'bottom', 'left'].flatMap(
            (side) => frame.querySelector<HTMLElement>(`:scope > [data-edge="${side}"]`) ?? []
          );
          gsap.to(edges, {
            scaleX: 1,
            scaleY: 1,
            duration,
            ease,
            stagger: duration * 0.7,
            delay: index * duration * 0.4
          });
        }
      }
    });
  }

  /**
   * Extends every `[data-leader]` hairline from its anchored side as it enters.
   *
   * @param duration Seconds the leader takes to extend
   * @param ease Ease for the leader
   */
  #drawLeaders(duration: number, ease: string): void {
    for (const leader of gsap.utils.toArray<HTMLElement>('[data-leader]')) {
      const side = leader.dataset.leader ?? 'left';
      gsap.from(leader, {
        scaleX: 0,
        transformOrigin: `${side} center`,
        duration: duration * 1.5,
        ease,
        scrollTrigger: {
          trigger: leader,
          start: SceneDrawingService.#START,
          end: SceneDrawingService.#END,
          once: true
        }
      });
    }
  }
}

const sceneDrawingService = new SceneDrawingService();
export default sceneDrawingService;
