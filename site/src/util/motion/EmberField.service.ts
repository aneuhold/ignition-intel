import { gsap } from 'gsap';
import motionTokensService from './MotionTokens.service';

/**
 * One rising ember in the field.
 */
interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Drawn sprite size in CSS pixels; the bright core is about a fifth of it. */
  size: number;
  age: number;
  life: number;
  /** Index into the sprite list (gold or rust). */
  sprite: number;
  phase: number;
  sway: number;
}

/**
 * Pointer position relative to the canvas, or null when it's elsewhere.
 */
type PointerPosition = { x: number; y: number } | null;

/**
 * Rising gold and rust embers drawn on the hero's `[data-ember-field]`
 * canvas. Embers drift away from a nearby pointer. The simulation runs on
 * `gsap.ticker` and only while the canvas is on screen and the tab is
 * visible. Particle count and pixel density are capped, lower on small
 * screens, and the whole field is skipped under reduced motion.
 */
class EmberFieldService {
  static readonly #MAX_EMBERS = { wide: 80, narrow: 20 };

  /** Canvas area, in CSS pixels squared, per ember before the cap applies. */
  static readonly #AREA_PER_EMBER = 14000;

  static readonly #MAX_PIXEL_RATIO = 1.5;

  /** Radius around the pointer, in CSS pixels, that pushes embers away. */
  static readonly #POINTER_RADIUS = 140;

  static readonly #POINTER_FORCE = 220;

  /** Resolution of each pre-rendered glow sprite. */
  static readonly #SPRITE_SIZE = 64;

  /** Share of embers drawn in gold; the rest are rust. */
  static readonly #GOLD_SHARE = 0.7;

  /**
   * Starts the field once the cue settles.
   *
   * @param cue Settles when the hero is ready (after the home intro, or at once)
   */
  attach(cue: Promise<void>): () => void {
    const canvas = document.querySelector<HTMLCanvasElement>('[data-ember-field]');
    if (!canvas) return () => undefined;
    let attached = true;
    const matchMedia = gsap.matchMedia();

    void (async () => {
      await cue;
      if (!attached) return;
      matchMedia.add(
        {
          wide: '(min-width: 48rem) and (prefers-reduced-motion: no-preference)',
          narrow: '(max-width: 47.99rem) and (prefers-reduced-motion: no-preference)'
        },
        (context) => {
          const { wide } = context.conditions ?? {};
          return this.#run(canvas, wide ? 'wide' : 'narrow');
        }
      );
    })();

    return () => {
      attached = false;
      matchMedia.revert();
    };
  }

  /**
   * Runs the simulation on a canvas and returns the function that stops it.
   *
   * @param canvas The canvas to draw on
   * @param size Which particle cap applies
   */
  #run(canvas: HTMLCanvasElement, size: 'wide' | 'narrow'): () => void {
    const ctx = canvas.getContext('2d');
    const host = canvas.parentElement;
    if (!ctx || !host) return () => undefined;

    const styles = getComputedStyle(document.documentElement);
    const core = styles.getPropertyValue('--color-foreground').trim();
    const sprites = [
      this.#sprite(core, styles.getPropertyValue('--color-primary').trim()),
      this.#sprite(core, styles.getPropertyValue('--color-accent').trim())
    ];
    let width = 0;
    let height = 0;
    let embers: Ember[] = [];
    let pointer: PointerPosition = null;

    const resize = (): void => {
      const ratio = Math.min(window.devicePixelRatio || 1, EmberFieldService.#MAX_PIXEL_RATIO);
      width = host.clientWidth;
      height = host.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(
        EmberFieldService.#MAX_EMBERS[size],
        Math.round((width * height) / EmberFieldService.#AREA_PER_EMBER)
      );
      embers = Array.from({ length: count }, (_, index) =>
        this.#spawn(embers[index] ?? this.#blank(), width, height, true)
      );
    };

    const tick = (time: number, deltaMs: number): void => {
      const dt = Math.min(deltaMs, 50) / 1000;
      const damping = Math.pow(0.4, dt);
      const radius = EmberFieldService.#POINTER_RADIUS;
      ctx.clearRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';
      for (const ember of embers) {
        ember.age += dt;
        if (ember.age >= ember.life || ember.y < -ember.size) {
          this.#spawn(ember, width, height, false);
        }
        if (pointer) {
          const dx = ember.x - pointer.x;
          const dy = ember.y - pointer.y;
          const distance = Math.hypot(dx, dy) || 1;
          if (distance < radius) {
            const push = (1 - distance / radius) * EmberFieldService.#POINTER_FORCE * dt;
            ember.vx += (dx / distance) * push;
            ember.vy += (dy / distance) * push * 0.5;
          }
        }
        ember.vx *= damping;
        ember.x += (ember.vx + Math.cos(time * 1.3 + ember.phase) * ember.sway) * dt;
        ember.y += ember.vy * dt;

        const progress = ember.age / ember.life;
        const fade = progress < 0.15 ? progress / 0.15 : (1 - progress) / 0.85;
        const flicker = 0.75 + 0.25 * Math.sin(time * 9 + ember.phase * 3);
        ctx.globalAlpha = Math.max(0, fade * flicker * 0.9);
        ctx.drawImage(
          sprites[ember.sprite],
          ember.x - ember.size / 2,
          ember.y - ember.size / 2,
          ember.size,
          ember.size
        );
      }
      ctx.globalAlpha = 1;
    };

    let onScreen = false;
    let running = false;
    const sync = (): void => {
      const shouldRun = onScreen && document.visibilityState === 'visible';
      if (shouldRun === running) return;
      running = shouldRun;
      if (running) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    };
    const visibility = new IntersectionObserver(([entry]) => {
      onScreen = entry?.isIntersecting ?? false;
      sync();
    });
    const sizing = new ResizeObserver(resize);
    const move = (event: PointerEvent): void => {
      if (event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const leave = (): void => {
      pointer = null;
    };

    resize();
    visibility.observe(canvas);
    sizing.observe(host);
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', sync);
    gsap.fromTo(
      canvas,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: motionTokensService.duration('cinema') }
    );

    return () => {
      gsap.ticker.remove(tick);
      visibility.disconnect();
      sizing.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', sync);
      ctx.clearRect(0, 0, width, height);
    };
  }

  /**
   * Resets an ember to a fresh start. Initial embers are scattered through
   * the field and part-way through their lives so the first frame isn't empty.
   *
   * @param ember The ember to reset in place
   * @param width Field width in CSS pixels
   * @param height Field height in CSS pixels
   * @param initial Whether this is the first fill of the field
   */
  #spawn(ember: Ember, width: number, height: number, initial: boolean): Ember {
    ember.x = Math.random() * width;
    ember.y = initial ? height * (0.3 + Math.random() * 0.7) : height + 10;
    ember.vx = (Math.random() - 0.5) * 12;
    ember.vy = -(18 + Math.random() * 46);
    ember.size = 6 + Math.random() * 16;
    ember.life = 5 + Math.random() * 7;
    ember.age = initial ? Math.random() * ember.life * 0.6 : 0;
    ember.sprite = Math.random() < EmberFieldService.#GOLD_SHARE ? 0 : 1;
    ember.phase = Math.random() * Math.PI * 2;
    ember.sway = 4 + Math.random() * 16;
    return ember;
  }

  /**
   * An ember with every field zeroed, ready for {@link EmberFieldService.#spawn}.
   */
  #blank(): Ember {
    return { x: 0, y: 0, vx: 0, vy: 0, size: 0, age: 0, life: 1, sprite: 0, phase: 0, sway: 0 };
  }

  /**
   * Pre-renders one soft glow so each frame is a cheap `drawImage` per ember.
   *
   * @param core Hex color of the hot center
   * @param color Hex color of the glow
   */
  #sprite(core: string, color: string): HTMLCanvasElement {
    const size = EmberFieldService.#SPRITE_SIZE;
    const sprite = document.createElement('canvas');
    sprite.width = size;
    sprite.height = size;
    const ctx = sprite.getContext('2d');
    if (!ctx) return sprite;
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, core);
    gradient.addColorStop(0.18, this.#withAlpha(color, 0.95));
    gradient.addColorStop(0.45, this.#withAlpha(color, 0.3));
    gradient.addColorStop(1, this.#withAlpha(color, 0));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return sprite;
  }

  /**
   * Converts a `#rrggbb` color to `rgb(r g b / alpha)`.
   *
   * @param hex A six-digit hex color
   * @param alpha Opacity from 0 to 1
   */
  #withAlpha(hex: string, alpha: number): string {
    const value = Number.parseInt(hex.replace('#', ''), 16);
    return `rgb(${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255} / ${alpha})`;
  }
}

const emberFieldService = new EmberFieldService();
export default emberFieldService;
