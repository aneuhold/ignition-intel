# Ignition Intel Website

[![Live Site](https://img.shields.io/badge/Live%20Site-ignition--intel-blue?style=for-the-badge&logo=cloudflare&logoColor=white)](https://ignitionintel.com/)
[![Admin](https://img.shields.io/badge/Admin-Sveltia%20CMS-purple?style=for-the-badge)](https://ignitionintel.com/admin)

The main website for Ignition Intel.

## Deployments

| Resource             | Type       | Dashboard                                                                                                                                                                     |
| -------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend site        | Pages      | [ignition-intel-frontend](https://dash.cloudflare.com/f5fee77ff79a01ea91f541b825d003a3/pages/view/ignition-intel-frontend)                                                    |
| Contact form         | Worker     | [ignition-contact](https://dash.cloudflare.com/f5fee77ff79a01ea91f541b825d003a3/workers/services/view/ignition-contact/production)                                            |
| CMS auth             | Worker     | [ignition-cms-auth](https://dash.cloudflare.com/f5fee77ff79a01ea91f541b825d003a3/workers/services/view/ignition-cms-auth/production)                                          |
| Contact form captcha | Turnstile  | [ignition-turnstile](https://dash.cloudflare.com/f5fee77ff79a01ea91f541b825d003a3/turnstile/widget/0x4AAAAAAGEZqPgDbZiAJBj8)                                                  |
| CMS media            | R2 Bucket  | [ignition-intel-media](https://dash.cloudflare.com/f5fee77ff79a01ea91f541b825d003a3/r2/default/buckets/ignition-intel-media) (public host `media.ignitionintel.aneuhold.dev`) |
| Domain               | Cloudflare | [ignitionintel.com](https://dash.cloudflare.com/f5fee77ff79a01ea91f541b825d003a3/ignitionintel.com)                                                                           |

## Infrastructure

- Focus is on an incredibly performant frontend with outstanding SEO, so we use [Astro](https://astro.build/).
- Islands use Svelte for the clean reactivity and compile-based output step. No shadow-DOM.
- Dynamic content runs on Cloudflare Workers. [Link to docs on the free-tier limits](https://developers.cloudflare.com/workers/platform/limits/). See [the details on the workers here](docs/worker-details.md).
- Transactional email goes through [Resend](https://resend.com/), so a lot of the hoops for email not being blocked by spam blockers can be jumped through more easily.
- The CMS is [Sveltia](https://sveltiacms.app/en/): targeted fields can be edited and images uploaded or removed without a full editable UI.

### Security

- Form security
  - Turnstile Captcha for blocking bots automatically
  - Hidden input honeypot field
  - Worker-side rate-limiting
  - Basic format validation
- General worker security
  - Rate limits are applied, which is a built-in feature of CF workers, [link to docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/). See each worker's `wrangler.jsonc` for its current rate limits.

### Assets

- Hand-picked/static brand assets (logos, icons, etc.) live in `site/src/assets` so Astro can optimize and hash them at build time. `pnpm generate:assets` renders the favicons, PWA icons, and OG image from `site/src/assets/logo.svg` and `scripts/og-image/index.html`.
- CMS-managed inline images (gallery photos, hero image, About body images) live in the `ignition-intel-media` R2 bucket and are served from `https://media.ignitionintel.aneuhold.dev`. Sveltia uploads directly to R2; Astro fetches and optimizes the remote URLs at build time via `image.remotePatterns` and caches the output under `node_modules/.astro/`. The bucket is flat, so every upload name needs to be unique, otherwise it will overwrite.

### Deployment

- Uses GitHub Actions for most of the build process to keep things centralized.
- The token used for the GitHub Actions as far as Cloudflare is described [here](docs/cloudflare-token-setup.md).

## Development

1. Install everything with `pnpm i`
1. Check out the [root package.json](package.json) for the commands.

### Sveltia CMS Development

1. Run `pnpm dev` like normal.
2. Navigate to http://localhost:4321/admin and select local mode. It will ask you to choose the repository, so choose the `ignition-intel` folder, not the site folder.
3. Make updates to see them change the code locally. It works best with text updates. You can add images, but stop then start the dev server afterwards so Astro can optimize them.

When changing the content model itself (adding, updating, renaming, moving, or removing a collection or its fields), use the [`cms-content`](.claude/skills/cms-content/SKILL.md) skill (`/cms-content <what to change>` in Claude Code). It walks through the paired Sveltia + Astro edits so neither side falls out of sync.
