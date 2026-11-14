# Launch Checklist

## Technical

### Cloudflare

- [ ] Create the `ignition-intel-repo-token` API token ([setup](cloudflare-token-setup.md)), then add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets
- [ ] Create the `ignition-intel-frontend` Pages project and attach `ignitionintel.com` (plus `www`)
- [ ] Create the `ignition-intel-media` R2 bucket with custom domain `media.ignitionintel.aneuhold.dev`
- [ ] Create a bucket-scoped R2 API token: access key ID goes in `site/public/admin/config.yml`, secret goes to `cms-auth` as `R2_MEDIA_SECRET_ACCESS_KEY`
- [ ] Create the `ignition-turnstile` widget: sitekey goes in `globalConstants.turnstileSitekey`, secret goes to `contact` as `CLOUDFLARE_TURNSTILE_SECRET_KEY`
- [ ] Confirm rate-limit `namespace_id`s 2001 / 2002 don't collide with anything else on the account
- [ ] First worker deploy (`pnpm deploy:workers`, or merge to `main`)

### CMS auth

- [ ] Create the GitHub OAuth app (callback `https://ignition-cms-auth.agneuhold.workers.dev/callback`), then set `GITHUB_CMS_CLIENT_ID` / `GITHUB_CMS_CLIENT_SECRET` on `cms-auth`
- [ ] Add Nicole's GitHub username to `allowedUsers` in `workers/cms-auth/src/services/Auth.service.ts`

### Email

- [ ] Verify the `mail.ignitionintel.com` sending domain in Resend
- [ ] Create a Resend API key and set it on `contact` as `RESEND_API_KEY`
- [ ] Update `ownerEmail` / `fromEmail` in `workers/contact/src/util/contactWorkerConstants.ts`

### Sentry

- [ ] Create `ignition-contact` and `ignition-cms-auth` projects and paste the DSNs into each worker's `src/index.ts`

### Local dev

- [ ] Create the repo-root `.env` for `wrangler dev` (same shape as the pub repo's)

### Design and content

- [ ] Real logo in `site/src/assets/logo.svg`, then `pnpm generate:assets`
- [ ] Colors and fonts in `site/src/styles/tokens.css` and `site/astro.config.ts`
- [ ] Sync `webManifestThemeColor` / `webManifestBackgroundColor` in `globalConstants.ts` with the new tokens
- [ ] Fill in "Brand direction" in `.claude/skills/site-design/SKILL.md`
- [ ] Replace placeholder copy: page `description`s in `site/src/pages/*.astro`, home section, services page
- [ ] Seed content in `site/src/content/` (or via the CMS)

### After launch

- [ ] PR Lighthouse job fails until the prod URL is live; recheck it afterwards
- [ ] Google Search Console and Bing Webmaster Tools

## Ask Nicole

- [ ] Which email should receive contact form submissions? Which email should show publicly?
- [ ] Should a phone number be shown on the site?
- [ ] Service area or location to list?
- [ ] What services should the Services page list?
- [ ] Bio, background, and credentials for the About page
- [ ] Photos: headshot, a hero image, anything for a gallery
- [ ] Existing logo or brand colors?
- [ ] Tagline wording
- [ ] Social or directory links (LinkedIn, Google Business Profile, etc.)
- [ ] Any extra fields on the contact form (phone, case type, etc.)?
- [ ] Does she want to edit the site herself? If so, her GitHub username
