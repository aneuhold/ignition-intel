import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import type { MotionContext } from './MotionContext';

/**
 * Splits a headline into masked lines and raises each line into place, one after another,
 * when the headline scrolls into view.
 */
class SplitHeadlineService {
  /**
   * Starts the reveal on one headline.
   *
   * @param headline The heading element to split
   * @param context Shared motion tokens
   * @param context.tokens Durations and easings from `motion.css`
   */
  attach(headline: HTMLElement, { tokens }: MotionContext): void {
    SplitText.create(headline, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      // SplitText's types say onSplit returns void, but returning the tween lets SplitText
      // revert and re-sync it on each re-split: https://gsap.com/docs/v3/Plugins/SplitText/
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSplit: (self) => {
        // Tight poster leading lets glyphs overhang their line box; pad the masks so
        // commas and apostrophes aren't clipped, and pull the margin back so the
        // layout doesn't move.
        gsap.set(self.masks, { paddingBlock: '0.12em', marginBlock: '-0.12em' });
        return gsap.from(self.lines, {
          yPercent: 115,
          duration: tokens.slow,
          ease: tokens.burn,
          stagger: tokens.snap / 2,
          scrollTrigger: { trigger: headline, start: 'top 90%', once: true }
        });
      }
    });
  }
}

const splitHeadlineService = new SplitHeadlineService();
export default splitHeadlineService;
