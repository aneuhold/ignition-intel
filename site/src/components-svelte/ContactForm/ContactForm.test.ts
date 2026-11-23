import { cleanup, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderSvelteComponent } from '../../../testUtils/renderSvelteComponent';
import contactFormService from './ContactForm.service';
import ContactForm from './ContactForm.svelte';
import { contactFormConstants } from './contactFormConstants';

const courses = [{ slug: 'scene-documentation', title: 'Scene Documentation' }];

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
    window.history.replaceState(null, '', '/');
  });

  it('pre-fills the course and starter message from the course query parameter', async () => {
    installTurnstileMock();
    window.history.replaceState(null, '', '/contact?course=scene-documentation');
    renderSvelteComponent(ContactForm, { props: { courses } });

    await vi.waitFor(() =>
      expect(screen.getByTestId('contact-form-course')).toHaveTextContent('Scene Documentation')
    );
    expect(screen.getByTestId('contact-form-message')).toHaveValue(
      contactFormConstants.courseStarterMessage('Scene Documentation')
    );
  });

  it('starts empty without a course query parameter', () => {
    installTurnstileMock();
    window.history.replaceState(null, '', '/contact');
    renderSvelteComponent(ContactForm, { props: { courses } });

    expect(screen.queryByTestId('contact-form-course')).not.toBeInTheDocument();
    expect(screen.getByTestId('contact-form-message')).toHaveValue('');
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
