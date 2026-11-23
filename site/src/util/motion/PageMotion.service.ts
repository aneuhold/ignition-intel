import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import courseRailService from './CourseRail.service';
import marqueeService from './Marquee.service';
import type { MotionAttach } from './MotionContext';
import { MotionEffect } from './MotionEffect';
import motionTokensService from './MotionTokens.service';
import splitHeadlineService from './SplitHeadline.service';
import vPatternService from './VPattern.service';

/**
 * Runs the site's GSAP motion. On every page load (including Astro client-side
 * navigations) it finds each `[data-motion]` element, in document order so ScrollTriggers
 * are created top to bottom, and attaches the named effect. Before the next page swaps in,
 * it reverts every tween, ScrollTrigger, split, and inline style it added.
 *
 * Everything runs inside a `prefers-reduced-motion: no-preference` match, so with reduced
 * motion nothing is attached and content stays in its final state.
 */
class PageMotionService {
  static readonly #CONDITIONS = {
    motion: '(prefers-reduced-motion: no-preference)',
    // Wide and driven by a mouse or trackpad. Touch devices, tablets included, keep native
    // scrolling and never pin.
    desktop: '(min-width: 64rem) and (pointer: fine)'
  };

  readonly #effects: Record<MotionEffect, MotionAttach> = {
    [MotionEffect.SplitHeadline]: (element, context) => {
      splitHeadlineService.attach(element, context);
    },
    [MotionEffect.VBurn]: (element, context) => {
      vPatternService.burn(element, context);
    },
    [MotionEffect.VDrop]: (element) => {
      vPatternService.drop(element);
    },
    [MotionEffect.VWipe]: (element, context) => {
      vPatternService.wipe(element, context);
    },
    [MotionEffect.HeatMask]: (element) => {
      vPatternService.heat(element);
    },
    [MotionEffect.Marquee]: (element, context) => {
      marqueeService.attach(element, context);
    },
    [MotionEffect.CourseRail]: (element, context) => {
      courseRailService.attach(element, context);
    }
  };

  #revert: (() => void) | null = null;

  /**
   * Hooks the motion into Astro's page lifecycle. Call once, from a client script.
   */
  start(): void {
    gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
    // Mobile browsers resize the viewport as the address bar shows and hides; don't
    // recalculate every trigger for that.
    ScrollTrigger.config({ ignoreMobileResize: true });
    document.addEventListener('astro:page-load', () => {
      this.#attach(document.body);
    });
    document.addEventListener('astro:before-swap', () => {
      this.#detach();
    });
  }

  /**
   * Attaches every effect under the root, re-attaching when a media condition changes.
   *
   * @param root Element whose `[data-motion]` descendants get effects
   */
  #attach(root: HTMLElement): void {
    this.#detach();
    const tokens = motionTokensService.read();
    const context = gsap.context(() => {
      gsap.matchMedia().add(PageMotionService.#CONDITIONS, ({ conditions }) => {
        if (!conditions?.motion) return;
        const motionContext = { tokens, desktop: conditions.desktop };
        for (const element of root.querySelectorAll<HTMLElement>('[data-motion]')) {
          const effect = this.#effectOf(element);
          if (effect) this.#effects[effect](element, motionContext);
        }
      });
    }, root);
    this.#revert = () => {
      context.revert();
    };
    // Web fonts change headline and rail widths; measure again once they're in.
    void document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }

  /**
   * Reverts everything the last attach added.
   */
  #detach(): void {
    this.#revert?.();
    this.#revert = null;
  }

  /**
   * Reads an element's `data-motion` value as a known effect.
   *
   * @param element Element carrying `data-motion`
   */
  #effectOf(element: HTMLElement): MotionEffect | null {
    const { motion } = element.dataset;
    return Object.values(MotionEffect).find((effect) => effect === motion) ?? null;
  }
}

const pageMotionService = new PageMotionService();
export default pageMotionService;
