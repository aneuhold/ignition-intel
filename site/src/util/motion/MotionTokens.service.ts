import { CustomEase } from 'gsap/CustomEase';

/**
 * A duration token from `motion.css` (`--duration-<name>`).
 */
export type DurationToken = 'snap' | 'glide' | 'slow' | 'cinema';

/**
 * An easing token from `motion.css` (`--ease-<name>`).
 */
export type EaseToken = 'soft' | 'sweep';

/**
 * Reads the motion tokens declared in `motion.css` so GSAP tweens run on the
 * same durations and curves as the CSS transitions. Easings are registered
 * as CustomEases the first time they are asked for.
 */
class MotionTokensService {
  /** Used when a token can't be read, e.g. the stylesheet hasn't loaded. */
  static readonly #FALLBACK_SECONDS = 0.4;

  #easeNames = new Map<EaseToken, string>();

  /**
   * Returns a duration token in seconds, the unit GSAP expects.
   *
   * @param token The token name, without the `--duration-` prefix
   */
  duration(token: DurationToken): number {
    return this.parseDuration(this.#read(`--duration-${token}`));
  }

  /**
   * Returns the GSAP ease name registered for an easing token.
   *
   * @param token The token name, without the `--ease-` prefix
   */
  ease(token: EaseToken): string {
    const existing = this.#easeNames.get(token);
    if (existing) return existing;
    const name = `token-${token}`;
    CustomEase.create(name, this.parseCubicBezier(this.#read(`--ease-${token}`)));
    this.#easeNames.set(token, name);
    return name;
  }

  /**
   * Converts a CSS time (`150ms`, `1.2s`) to seconds.
   *
   * @param value A CSS `<time>` value
   */
  parseDuration(value: string): number {
    const match = /^(-?[\d.]+)(ms|s)$/.exec(value.trim());
    if (!match) return MotionTokensService.#FALLBACK_SECONDS;
    const amount = Number(match[1]);
    return match[2] === 'ms' ? amount / 1000 : amount;
  }

  /**
   * Converts `cubic-bezier(x1, y1, x2, y2)` to the `x1,y1,x2,y2` form
   * CustomEase accepts. Falls back to linear for anything else.
   *
   * @param value A CSS `cubic-bezier()` easing
   */
  parseCubicBezier(value: string): string {
    const numbers = /cubic-bezier\(([^)]+)\)/
      .exec(value)?.[1]
      ?.split(',')
      .map((n) => n.trim());
    return numbers?.length === 4 ? numbers.join(',') : '0,0,1,1';
  }

  /**
   * Reads a custom property off the root element.
   *
   * @param name The custom property, including the leading dashes
   */
  #read(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
}

const motionTokensService = new MotionTokensService();
export default motionTokensService;
