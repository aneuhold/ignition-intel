# Launch Checklist

## Technical

### Cloudflare

- [x] Create the `ignition-intel-repo-token` API token ([setup](cloudflare-token-setup.md)), then add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets
- [x] Create the `ignition-intel-frontend` Pages project and attach `ignitionintel.com` (plus `www`)
- [x] Create the `ignition-intel-media` R2 bucket with custom domain `media.ignitionintel.aneuhold.dev` (CORS allows `GET`/`PUT`/`HEAD` from `ignitionintel.com`, `ignition-intel-frontend.pages.dev`, and `localhost:4321`)
- [x] Create a bucket-scoped R2 API token: access key ID goes in `site/public/admin/config.yml`, secret goes to `cms-auth` as `R2_MEDIA_SECRET_ACCESS_KEY`
- [x] Create the `ignition-turnstile` widget: sitekey goes in `globalConstants.turnstileSitekey`, secret goes to `contact` as `CLOUDFLARE_TURNSTILE_SECRET_KEY`
- [x] Rate-limit `namespace_id`s: `contact` uses 1003 and `cms-auth` uses 1004, sharing counters with `aurora-contact` / `aurora-cms-auth`
- [x] First worker deploy (`pnpm deploy:workers`, or merge to `main`)

### CMS auth

- [x] Create the GitHub OAuth app (callback `https://ignition-cms-auth.agneuhold.workers.dev/callback`), then set `GITHUB_CMS_CLIENT_ID` / `GITHUB_CMS_CLIENT_SECRET` on `cms-auth`
- [ ] Add Nicole's GitHub username to `allowedUsers` in `workers/cms-auth/src/services/Auth.service.ts`

### Email

- [x] Verify the `mail.ignitionintel.com` sending domain in Resend
- [x] Create a Resend API key and set it on `contact` as `RESEND_API_KEY`
- [x] Update `ownerEmail` / `fromEmail` in `workers/contact/src/util/contactWorkerConstants.ts`

### Sentry

- [x] Create `ignition-contact` and `ignition-cms-auth` projects and paste the DSNs into each worker's `src/index.ts`

### Local dev

- [x] Create the repo-root `.env` for `wrangler dev` (same shape as the pub repo's)

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

- [x] Which email should receive contact form submissions? Which email should show publicly?
  - info@ignitionintel.com
- [x] Should a phone number be shown on the site?
  - No phone number. Just email.
- [x] Service area or location to list?
  - No address to be shown
- [ ] What services should the Services page list?
  - The services are basically going to be fire investigation training.
- [ ] Bio, background, and credentials for the About page
  - CV is going to be sent over
- [ ] Photos: headshot, a hero image, anything for a gallery
  - Can ask for a headshot or something later
- [x] Existing logo or brand colors?
- [x] Social or directory links (LinkedIn, Google Business Profile, etc.)
  - Not yet.
- [x] Any extra fields on the contact form (phone, case type, etc.)?
  - What we have now is good.
- [ ] Does she want to edit the site herself? If so, her GitHub username

- Questions about the overall look and feel:
  - Separate pages. Front page could be links to the classes they offer. Those links go to other pages, 1 intro page per course. So this will be editable in Sveltia to add new courses or remove them. Contact me button at the bottom that goes to a separate page with the form if they get past the course links.
  - So if they click "Get more info on getting this course" on a course page, it takes them to the contact me page with the title pre-filled and possibly the content too for that specific course.
  - Feel: Serious & Academic. Softer, but charcoal background. The pptx should show a lot of the look and feel that can be done. As far as copy, use the actual presentation named investigator as instrument.pptx.
