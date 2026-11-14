import { sentryWorkerOptions } from '@ignition/workers-shared';
import * as Sentry from '@sentry/cloudflare';
import type { Env } from './Env';
import contactService from './services/Contact.service';

export default Sentry.withSentry(
  // Empty DSN keeps Sentry inert. Paste the `ignition-contact` Sentry project's DSN here once it exists.
  () => sentryWorkerOptions(''),
  {
    async fetch(request, env): Promise<Response> {
      return contactService.handleRequest(request, env);
    }
  } satisfies ExportedHandler<Env>
);
