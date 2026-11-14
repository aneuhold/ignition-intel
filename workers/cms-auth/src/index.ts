import { checkIpRateLimit, sentryWorkerOptions } from '@ignition/workers-shared';
import * as Sentry from '@sentry/cloudflare';
import type { Env } from './Env';
import authService from './services/Auth.service';

/**
 * All of the code for this worker comes from here: https://github.com/sveltia/sveltia-cms-auth/blob/main/src/index.js
 *
 * It was just refactored to be cleaner.
 */
export default Sentry.withSentry(
  // Empty DSN keeps Sentry inert. Paste the `ignition-cms-auth` Sentry project's DSN here once it exists.
  () => sentryWorkerOptions(''),
  {
    async fetch(request, env): Promise<Response> {
      if (!(await checkIpRateLimit(request, env))) {
        return new Response('Too Many Requests', { status: 429 });
      }
      return authService.handleRequest(request, env);
    }
  } satisfies ExportedHandler<Env>
);
