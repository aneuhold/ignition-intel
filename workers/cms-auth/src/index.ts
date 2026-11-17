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
  () =>
    sentryWorkerOptions(
      'https://04fff2003cafa65e676973b264347955@o4507319328702464.ingest.us.sentry.io/4512444722839552'
    ),
  {
    async fetch(request, env): Promise<Response> {
      if (new URL(request.url).pathname === '/sentry-test-error') {
        throw new Error(`Sentry test error ignition-cms-auth ${Date.now()}`);
      }
      if (!(await checkIpRateLimit(request, env))) {
        return new Response('Too Many Requests', { status: 429 });
      }
      return authService.handleRequest(request, env);
    }
  } satisfies ExportedHandler<Env>
);
