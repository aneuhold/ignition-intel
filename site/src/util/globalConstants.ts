/**
 * A square PNG derived from the logo, used by iOS home-screen icons
 * (apple-touch-icon) and/or the PWA web manifest. Renders are produced by
 * `scripts/generate-logos.ts` from `logo-on-white.svg`.
 */
export interface PwaIcon {
  /** Square pixel dimension of the rendered PNG. */
  size: number;
  /** File name inside `site/public/`. */
  fileName: string;
  /** Whether to include this icon in the web manifest `icons` array. */
  inManifest: boolean;
}

/**
 * Public, non-secret constants shared across the site. Class fields are
 * ordered top to bottom as they build off of each other. No reason other than making it easier
 * to read.
 */
class GlobalConstants {
  /** Full display name. Used in OG tags, JSON-LD, and the web manifest. */
  readonly siteName = 'Ignition Intel';

  /** Short name for home-screen launchers / PWA install prompts. */
  readonly webManifestShortName = 'Ignition Intel';

  /** One-line summary used by the web manifest. */
  readonly webManifestDescription = 'Fire and arson investigation by Nicole Brewer.';

  /** Owner's name. Used as the JSON-LD `ProfessionalService.founder`. */
  readonly ownerName = 'Nicole Brewer';

  /** Areas of expertise (schema.org `ProfessionalService.knowsAbout`). */
  readonly knowsAbout: readonly string[] = [
    'Fire investigation',
    'Arson investigation',
    'Fire origin and cause determination'
  ];

  /**
   * Primary brand color as sRGB hex, equivalent of `--color-primary`
   * (`oklch(0.5 0.13 55)`) in `site/src/styles/tokens.css`. Used for the
   * browser theme bar and the web manifest's `theme_color`.
   *
   * Keep in sync when `--color-primary` changes: paste the OKLCH literal into
   * https://oklch.com/#0.5,0.13,55,100 and copy the displayed sRGB hex.
   */
  readonly webManifestThemeColor = '#994a00';

  /**
   * Page background as sRGB hex, equivalent of `--color-background`
   * (`oklch(0.98 0.006 80)`) in `site/src/styles/tokens.css`. Used by the
   * web manifest's splash-screen `background_color`.
   *
   * Keep in sync when `--color-background` changes: paste the OKLCH literal
   * into https://oklch.com/#0.98,0.006,80,100 and copy the displayed sRGB hex.
   */
  readonly webManifestBackgroundColor = '#fbf8f4';

  /**
   * Single source of truth for the PWA / Apple touch icons. Drives both the
   * asset-generation script (`scripts/generate-logos.ts`) and the web
   * manifest endpoint (`site/src/pages/site.webmanifest.ts`).
   */
  readonly pwaIcons: readonly PwaIcon[] = [
    { size: 180, fileName: 'apple-touch-icon.png', inManifest: false },
    { size: 192, fileName: 'icon-192.png', inManifest: true },
    { size: 512, fileName: 'icon-512.png', inManifest: true }
  ];

  readonly contactWorkerUrl = import.meta.env?.DEV
    ? 'http://localhost:8787'
    : 'https://ignition-contact.agneuhold.workers.dev';

  /**
   * Cloudflare Turnstile sitekey for the contact form widget. Currently
   * Cloudflare's "always passes" test sitekey
   * (https://developers.cloudflare.com/turnstile/troubleshooting/testing/);
   * swap in the real widget's sitekey once it exists.
   */
  readonly turnstileSitekey = '1x00000000000000000000AA';

  /**
   * Public host of the `ignition-intel-media` R2 bucket. Sveltia uploads
   * directly here; Astro's `image.remotePatterns` pins this exact host so
   * build-time optimization runs against it. The bucket is flat: every key
   * is just the (slugified) original filename. Pair with {@link mediaUrl}.
   */
  readonly mediaHost = 'https://media.ignitionintel.aneuhold.dev';

  /**
   * Builds the public URL for a CMS-managed media object. Use for hard-coded
   * editorial picks in components (hero photos, etc.); Sveltia-written entry
   * fields already contain a full URL.
   *
   * @param filename Bucket-root key, e.g. `team-photo.jpg`
   */
  mediaUrl(filename: string): string {
    return `${this.mediaHost}/${filename}`;
  }
}

export const globalConstants = new GlobalConstants();
