import { sharedContactFormConstants } from '@ignition/shared';

/**
 * Tweakable values for the ContactForm island. Anything that might be
 * adjusted without a logic change, like user-facing copy, lives here so the
 * component and the service stay focused on behavior. Field-length limits are spread in from `@ignition/shared` so the
 * Worker and the island share a single source of truth.
 */
export const contactFormConstants = {
  ...sharedContactFormConstants,
  textareaRows: 5,
  successMessage: 'Thanks! Your message is on its way.',
  serverErrorMessage: 'Something went wrong on our end. Please try again in a moment.',
  networkErrorMessage: 'Network error. Please try again.',
  turnstileLoadErrorMessage:
    'The spam check could not load. Please refresh the page or check that challenges.cloudflare.com is not blocked.',
  genericValidationMessage: 'Please check your entries and try again.',
  submitIdleLabel: 'Send message',
  submitBusyLabel: 'Sending…',
  /** URL query parameter holding the slug of the course a visitor is asking about. */
  courseQueryParam: 'course',
  /** Label before the course title when the form was opened from a course page. */
  courseReferenceLabel: 'Re:',
  /**
   * Starter message for a visitor arriving from a course page. They can edit
   * or replace it before sending.
   *
   * @param courseTitle Title of the course the visitor came from
   */
  courseStarterMessage: (courseTitle: string): string =>
    `Hi Nicole,\n\nI'd like more information about ${courseTitle}.\n\n`
};
