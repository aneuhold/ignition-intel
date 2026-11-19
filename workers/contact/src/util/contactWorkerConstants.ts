/**
 * Public, non-secret constants for the contact Worker. CORS origins are
 * shared across all workers; see `@ignition/workers-shared`.
 */
export const contactWorkerConstants = {
  /** Inbox the form submissions are delivered to. */
  ownerEmail: 'nicole@ignitionintel.com',
  /** `From` header used on outgoing Resend emails. */
  fromEmail: 'Ignition Intel <noreply@mail.ignitionintel.com>'
};
