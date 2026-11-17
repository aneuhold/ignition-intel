import { sentryWorkerOptions } from '@ignition/workers-shared';
import * as Sentry from '@sentry/cloudflare';
import type { Env } from './Env';
import contactService from './services/Contact.service';

export default Sentry.withSentry(
  () =>
    sentryWorkerOptions(
      'https://cb5958ffc15ff4064b975c2a94db429a@o4507319328702464.ingest.us.sentry.io/4512444722708480'
    ),
  {
    async fetch(request, env): Promise<Response> {
      if (new URL(request.url).pathname === '/sentry-test-error') {
        throw new Error(`Sentry test error ignition-contact ${Date.now()}`);
      }
      return contactService.handleRequest(request, env);
    }
  } satisfies ExportedHandler<Env>
);
