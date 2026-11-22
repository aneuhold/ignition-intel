import { readFileSync, writeFileSync } from 'node:fs';
import { globalConstants } from '../site/src/util/globalConstants';
import { ASSETS_DIR, PUBLIC_DIR, renderSquareIco, renderSquarePng } from './generate-logos-utils';
import designTokensService from './services/DesignTokens.service';

/**
 * Returns the logo-generation config. All file paths and tunable values live
 * here so the rest of the script just reads from one object.
 */
const getConfig = () => ({
  /** Gold logo (no text). Every favicon / PWA output is derived from this. */
  logoSource: `${ASSETS_DIR}/logo-gold.svg`,
  /**
   * Output served at `/favicon.svg` (referenced from the base layout of the site): the
   * logo centred on a square background rect. The ICO and PWA PNGs render
   * from this file so every output stays in sync.
   */
  faviconSvg: `${PUBLIC_DIR}/favicon.svg`,
  /** Output served at `/favicon.ico` — fallback for browsers that ignore the SVG. */
  faviconIco: `${PUBLIC_DIR}/favicon.ico`,
  /** Square sizes packed into the multi-image ICO. */
  faviconIcoSizes: [16, 32, 48],
  /** Space kept around the logo on each side, as a fraction of its longer edge. */
  faviconPadding: 0.12,
  /**
   * Color of the logo background rect: the site's page color.
   */
  backgroundColor: designTokensService.readHexColor('--color-background')
});

const config = getConfig();

/**
 * Reads the logo SVG and writes the favicon SVG: the viewBox is
 * widened to a square (plus padding) centred on the logo, and a background
 * rect covering that square is injected right after the opening <svg>. The
 * square is computed from the source viewBox so the variant stays in sync if
 * the logo's bounds change.
 */
const generateFaviconSvg = (): void => {
  const source = readFileSync(config.logoSource, 'utf8');
  const viewBoxMatch = source.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch?.[1].trim().split(/\s+/).map(Number);
  if (viewBox?.length !== 4 || viewBox.some(Number.isNaN)) {
    throw new Error(`Could not parse viewBox from ${config.logoSource}`);
  }
  const [x, y, width, height] = viewBox;
  const side = Math.max(width, height) * (1 + 2 * config.faviconPadding);
  const squareX = x - (side - width) / 2;
  const squareY = y - (side - height) / 2;
  const squareViewBox = `${squareX} ${squareY} ${side} ${side}`;
  const onBackground = source
    .replace(/viewBox="[^"]+"/, `viewBox="${squareViewBox}"`)
    .replace(
      /(<svg[^>]*>)/,
      `$1<rect x="${squareX}" y="${squareY}" width="${side}" height="${side}" fill="${config.backgroundColor}"/>`
    );
  writeFileSync(config.faviconSvg, onBackground);
  console.log(`  wrote ${config.faviconSvg}`);
};

/**
 * Renders the favicon SVG at each declared size, pads each to a
 * square with the configured background colour, then packs them into a
 * multi-image .ico.
 */
const generateFaviconIco = (): void => {
  renderSquareIco(
    config.faviconSvg,
    config.faviconIcoSizes,
    config.faviconIco,
    config.backgroundColor
  );
  console.log(`  wrote ${config.faviconIco}`);
};

/**
 * Renders the favicon SVG into the PWA / Apple touch-icon PNGs used
 * by iOS home-screen and the web manifest. Icon definitions come from
 * `globalConstants` so the manifest endpoint and this script stay aligned.
 */
const generatePwaIcons = (): void => {
  for (const icon of globalConstants.pwaIcons) {
    const output = `${PUBLIC_DIR}/${icon.fileName}`;
    renderSquarePng(config.faviconSvg, icon.size, output, config.backgroundColor);
    console.log(`  wrote ${output}`);
  }
};

console.log(`Logo source: ${config.logoSource}`);
generateFaviconSvg();
generateFaviconIco();
generatePwaIcons();
