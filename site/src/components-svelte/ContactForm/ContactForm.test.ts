import { cleanup, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderSvelteComponent } from '../../../testUtils/renderSvelteComponent';
import contactFormService from './ContactForm.service';
import ContactForm from './ContactForm.svelte';
import { contactFormConstants } from './contactFormConstants';

const installTurnstileMock = (): { triggerToken: (token: string) => void } => {
  let savedCallback: ((token: string) => void) | null = null;
  vi.spyOn(contactFormService, 'mountTurnstile').mockImplementation(async (_target, callbacks) => {
    savedCallback = callbacks.onToken;
    return Promise.resolve('widget-1');
  });
  vi.spyOn(contactFormService, 'removeTurnstile').mockImplementation(() => {});
  vi.spyOn(contactFormService, 'resetTurnstile').mockImplementation(() => {});
  return {
    triggerToken: (token: string) => {
      savedCallback?.(token);
    }
  };
};

describe('ContactForm', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/');
  });

  describe('course prefill', () => {
    const courses = [{ slug: 'origin-and-cause', title: 'Origin and Cause' }];

    it('pre-fills the message for the course in the URL', async () => {
      installTurnstileMock();
      window.history.replaceState({}, '', '/contact?course=origin-and-cause');
      renderSvelteComponent(ContactForm, { props: { courses } });

      await vi.waitFor(() =>
        expect(screen.getByTestId('contact-form-message')).toHaveValue(
          contactFormConstants.courseStarterMessage('Origin and Cause')
        )
      );
      expect(screen.getByTestId('contact-form-course')).toHaveTextContent('Origin and Cause');
    });

    it('leaves the form empty without a matching course', () => {
      installTurnstileMock();
      window.history.replaceState({}, '', '/contact?course=unknown');
      renderSvelteComponent(ContactForm, { props: { courses } });

      expect(screen.getByTestId('contact-form-message')).toHaveValue('');
      expect(screen.queryByTestId('contact-form-course')).not.toBeInTheDocument();
    });

    it('lets the visitor edit the pre-filled message', async () => {
      installTurnstileMock();
      const user = userEvent.setup();
      window.history.replaceState({}, '', '/contact?course=origin-and-cause');
      renderSvelteComponent(ContactForm, { props: { courses } });
      const message = screen.getByTestId('contact-form-message');
      await vi.waitFor(() => expect(message).not.toHaveValue(''));

      await user.clear(message);
      await user.type(message, 'Can you teach this in Spokane?');

      expect(message).toHaveValue('Can you teach this in Spokane?');
    });
  });

  it('renders the name, email, message, and honeypot inputs', () => {
    installTurnstileMock();
    renderSvelteComponent(ContactForm);
    expect(screen.getByTestId('contact-form-name')).toBeInTheDocument();
    expect(screen.getByTestId('contact-form-email')).toBeInTheDocument();
    expect(screen.getByTestId('contact-form-message')).toBeInTheDocument();
    const honeypot = screen.getByTestId('contact-form-honeypot');
    expect(honeypot).toBeInTheDocument();
    expect(honeypot.getAttribute('tabindex')).toBe('-1');
  });

  it('keeps the submit button disabled until a Turnstile token arrives', async () => {
    const { triggerToken } = installTurnstileMock();
    const user = userEvent.setup();
    renderSvelteComponent(ContactForm);

    await user.type(screen.getByTestId('contact-form-name'), 'Alice');
    await user.type(screen.getByTestId('contact-form-email'), 'a@example.com');
    await user.type(screen.getByTestId('contact-form-message'), 'Hello');

    const submit = screen.getByTestId('contact-form-submit');
    expect(submit).toBeDisabled();

    triggerToken('test-token');
    await vi.waitFor(() => expect(submit).not.toBeDisabled());
  });

  it('delegates submission to the service with the entered values', async () => {
    const { triggerToken } = installTurnstileMock();
    const submitSpy = vi.spyOn(contactFormService, 'submit').mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderSvelteComponent(ContactForm);

    await user.type(screen.getByTestId('contact-form-name'), 'Alice');
    await user.type(screen.getByTestId('contact-form-email'), 'a@example.com');
    await user.type(screen.getByTestId('contact-form-message'), 'Hello there');
    triggerToken('test-token');
    await vi.waitFor(() => expect(screen.getByTestId('contact-form-submit')).not.toBeDisabled());

    await user.click(screen.getByTestId('contact-form-submit'));

    await vi.waitFor(() => expect(submitSpy).toHaveBeenCalledTimes(1));
    expect(submitSpy).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'a@example.com',
      message: 'Hello there',
      website: '',
      turnstileToken: 'test-token'
    });
    await vi.waitFor(() => expect(screen.getByTestId('contact-form-success')).toBeInTheDocument());
  });
});
