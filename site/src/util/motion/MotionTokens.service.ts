import { CustomEase } from 'gsap/CustomEase';

/**
 * Durations (in seconds) and GSAP ease names read from the motion tokens in `motion.css`.
 */
export interface MotionTokens {
  snap: number;
  glide: number;
  slow: number;
  marquee: number;
  /** GSAP ease registered from `--ease-soft`. */
  soft: string;
  /** GSAP ease registered from `--ease-burn`. */
  burn: string;
}

/**
 * Reads the motion tokens from the CSS custom properties Tailwind emits for `motion.css`, so
 * GSAP tweens and CSS transitions share one set of durations and easings.
 */
class MotionTokensService {
  static readonly #CUBIC_BEZIER = /cubic-bezier\(([^)]+)\)/;

  /**
   * Reads every motion token from the document root and registers the easings with GSAP.
   * Requires `CustomEase` to be registered.
   */
  read(): MotionTokens {
    const styles = getComputedStyle(document.documentElement);
    return {
      snap: this.#duration(styles, '--duration-snap'),
      glide: this.#duration(styles, '--duration-glide'),
      slow: this.#duration(styles, '--duration-slow'),
      marquee: this.#duration(styles, '--duration-marquee'),
      soft: this.#ease(styles, '--ease-soft', 'ii-soft'),
      burn: this.#ease(styles, '--ease-burn', 'ii-burn')
    };
  }

  /**
   * Parses a `ms` or `s` duration custom property into seconds.
   *
   * @param styles Computed styles of the document root
   * @param property Custom property name, e.g. `--duration-glide`
   */
  #duration(styles: CSSStyleDeclaration, property: string): number {
    const value = styles.getPropertyValue(property).trim();
    const amount = parseFloat(value);
    if (Number.isNaN(amount)) {
      throw new Error(`Motion token ${property} is missing or not a duration.`);
    }
    return value.endsWith('ms') ? amount / 1000 : amount;
  }

  /**
   * Registers a `cubic-bezier()` custom property as a named GSAP ease and returns the name.
   *
   * @param styles Computed styles of the document root
   * @param property Custom property name, e.g. `--ease-soft`
   * @param name Name to register the ease under
   */
  #ease(styles: CSSStyleDeclaration, property: string, name: string): string {
    const match = MotionTokensService.#CUBIC_BEZIER.exec(styles.getPropertyValue(property));
    if (!match) {
      throw new Error(`Motion token ${property} is missing or not a cubic-bezier().`);
    }
    const [x1, y1, x2, y2] = match[1].split(',').map((part) => part.trim());
    CustomEase.create(name, `M0,0 C${x1},${y1} ${x2},${y2} 1,1`);
    return name;
  }
}

const motionTokensService = new MotionTokensService();
export default motionTokensService;
