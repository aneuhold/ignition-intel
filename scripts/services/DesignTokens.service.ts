import { formatHex } from 'culori';
import { readFileSync } from 'node:fs';

/**
 * Reads the site's design tokens (colors and fonts) from `tokens.css` so
 * build-time render targets (favicons, OG image, …) use the same values as
 * the site without bringing the Tailwind toolchain along.
 */
class DesignTokensService {
  /** Path to the design-token source of truth, relative to the repo root. */
  static readonly #TOKENS_CSS_PATH = 'site/src/styles/tokens.css';

  /**
   * Returns the `@theme { … }` block rewritten as plain CSS (`:root { … }`).
   * Inject the result into a browser page, e.g. with
   * `page.addStyleTag({ content })`, so `var(--color-*)` resolves there.
   */
  readCss(): string {
    return `:root {\n${this.#readThemeBody()}\n}\n`;
  }

  /**
   * Returns a color token as a 6-digit sRGB hex string (e.g. `#393e46`), for
   * tools that only understand hex. The token must be a literal color in any
   * CSS format (hex, `oklch()`, …); colors derived from other variables (e.g.
   * relative color syntax) can't be resolved outside a browser and throw.
   *
   * @param name Custom property name including the leading dashes, e.g. `--color-background`
   */
  readHexColor(name: string): string {
    const value = this.#readValue(name);
    const hex = formatHex(value);
    if (!hex) {
      throw new Error(`${name} (${value}) is not a literal color that can be converted to hex`);
    }
    return hex;
  }

  /**
   * Returns the declared value of a single token, exactly as written in
   * `tokens.css`. Values that reference other variables come back unresolved.
   *
   * @param name Custom property name including the leading dashes
   */
  #readValue(name: string): string {
    const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const withoutComments = this.#readThemeBody().replace(/\/\*[\s\S]*?\*\//g, '');
    const declaration = new RegExp(`(?:^|[\\s;])${escapedName}\\s*:\\s*([^;]+);`).exec(
      withoutComments
    );
    if (!declaration) {
      throw new Error(`Could not find ${name} in ${DesignTokensService.#TOKENS_CSS_PATH}`);
    }
    return declaration[1].trim();
  }

  /**
   * Returns the body of the `@theme` block, walking braces so nested blocks
   * don't trip the parser the way a non-greedy regex would.
   */
  #readThemeBody(): string {
    const css = readFileSync(DesignTokensService.#TOKENS_CSS_PATH, 'utf8');
    const open = /@theme\s*\{/.exec(css);
    if (!open) {
      throw new Error(`Could not find @theme block in ${DesignTokensService.#TOKENS_CSS_PATH}`);
    }
    const start = open.index + open[0].length;
    let depth = 1;
    for (let i = start; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      else if (css[i] === '}') {
        depth -= 1;
        if (depth === 0) return css.slice(start, i).trim();
      }
    }
    throw new Error(`Unterminated @theme block in ${DesignTokensService.#TOKENS_CSS_PATH}`);
  }
}

const designTokensService = new DesignTokensService();
export default designTokensService;
