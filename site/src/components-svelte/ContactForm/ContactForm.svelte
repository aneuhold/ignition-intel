<!--
  @component
  Contact form island. Posts name/email/message + a Turnstile token to the
  ignition-contact Worker. Includes a hidden honeypot the worker checks server-
  side. When the page URL names a course (`?course=<slug>`), the message starts
  pre-filled with a note about that course, which the visitor can edit. All logic (Turnstile lifecycle, fetch, response interpretation) lives
  in `ContactForm.service.ts`; this file owns state and markup.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import contactFormService, { type ContactFormCourse } from './ContactForm.service';
  import { contactFormConstants } from './contactFormConstants';

  type Status = 'idle' | 'submitting' | 'success' | 'error';

  interface Props {
    /** Courses the `?course=<slug>` query parameter can pre-fill the form for. */
    courses?: ContactFormCourse[];
  }

  const { courses = [] }: Props = $props();

  let name = $state('');
  let email = $state('');
  let message = $state('');
  let website = $state('');
  let turnstileToken = $state('');
  let status = $state<Status>('idle');
  let errorMessage = $state('');
  let turnstileEl = $state<HTMLDivElement | null>(null);
  let widgetId: string | null = null;
  let course = $state<ContactFormCourse | undefined>(undefined);

  onMount(() => {
    course = contactFormService.courseFromSearch(window.location.search, courses);
    if (course) message = contactFormConstants.courseStarterMessage(course.title);
  });

  const canSubmit = $derived(
    status !== 'submitting' &&
      turnstileToken.length > 0 &&
      name.trim().length > 0 &&
      email.trim().length > 0 &&
      message.trim().length > 0
  );

  $effect(() => {
    if (!turnstileEl) return;
    const target = turnstileEl;
    let cancelled = false;

    const mountWidget = async (): Promise<void> => {
      const elementId = await contactFormService.mountTurnstile(target, {
        onToken: (token) => {
          turnstileToken = token;
        },
        onExpired: () => {
          turnstileToken = '';
        },
        onError: () => {
          turnstileToken = '';
        }
      });
      // If the effect was torn down while the script was loading,
      // remove the widget here — the cleanup function already ran with widgetId still null.
      if (cancelled) {
        if (elementId !== null) contactFormService.removeTurnstile(elementId);
        return;
      }
      if (elementId === null) {
        status = 'error';
        errorMessage = contactFormConstants.turnstileLoadErrorMessage;
        return;
      }
      widgetId = elementId;
    };
    void mountWidget();

    return () => {
      cancelled = true;
      if (widgetId !== null) {
        contactFormService.removeTurnstile(widgetId);
        widgetId = null;
      }
    };
  });

  const handleSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();
    if (!canSubmit) return;
    status = 'submitting';
    errorMessage = '';
    const result = await contactFormService.submit({
      name,
      email,
      message,
      website,
      turnstileToken
    });
    // Turnstile tokens are single use (siteverify rejects a replay with
    // `timeout-or-duplicate`), so every attempt needs a fresh challenge
    // whether or not it succeeded.
    // https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
    turnstileToken = '';
    if (widgetId !== null) contactFormService.resetTurnstile(widgetId);
    if (result.ok) {
      status = 'success';
      name = '';
      email = '';
      message = '';
      return;
    }
    status = 'error';
    errorMessage = result.message;
  };
</script>

<div class="w-full" data-testid="contact-form">
  {#if status === 'success'}
    <p
      data-testid="contact-form-success"
      class="border-l-4 border-primary bg-foreground/5 p-6 text-lg text-foreground"
    >
      {contactFormConstants.successMessage}
    </p>
  {:else}
    <form class="flex flex-col gap-6" onsubmit={handleSubmit} novalidate>
      {#if course}
        <p data-testid="contact-form-course" class="border-l-4 border-primary pl-4">
          <span class="block font-display text-sm uppercase tracking-[0.18em] text-foreground/70">
            {contactFormConstants.courseLabel}
          </span>
          <span class="font-display text-xl font-bold">{course.title}</span>
        </p>
      {/if}
      <label class="flex flex-col gap-2">
        <span class="font-display text-sm uppercase tracking-[0.18em] text-foreground/70">
          Name
        </span>
        <input
          data-testid="contact-form-name"
          type="text"
          name="name"
          required
          maxlength={contactFormConstants.maxNameLength}
          autocomplete="name"
          bind:value={name}
          class="border-2 border-foreground/15 bg-muted px-4 py-3 text-foreground transition-colors duration-(--duration-snap) ease-soft focus:border-primary focus:outline-none"
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="font-display text-sm uppercase tracking-[0.18em] text-foreground/70">
          Email
        </span>
        <input
          data-testid="contact-form-email"
          type="email"
          name="email"
          required
          maxlength={contactFormConstants.maxEmailLength}
          autocomplete="email"
          bind:value={email}
          class="border-2 border-foreground/15 bg-muted px-4 py-3 text-foreground transition-colors duration-(--duration-snap) ease-soft focus:border-primary focus:outline-none"
        />
      </label>

      <label class="flex flex-col gap-2">
        <span class="font-display text-sm uppercase tracking-[0.18em] text-foreground/70">
          Message
        </span>
        <textarea
          data-testid="contact-form-message"
          name="message"
          required
          rows={contactFormConstants.textareaRows}
          maxlength={contactFormConstants.maxMessageLength}
          bind:value={message}
          class="border-2 border-foreground/15 bg-muted px-4 py-3 text-foreground transition-colors duration-(--duration-snap) ease-soft focus:border-primary focus:outline-none"
        ></textarea>
      </label>

      <!-- Honeypot: hidden from real users (visually + AT), bots tend to fill it. -->
      <input
        data-testid="contact-form-honeypot"
        type="text"
        name="website"
        tabindex="-1"
        autocomplete="off"
        aria-hidden="true"
        bind:value={website}
        class="pointer-events-none absolute -z-10 h-0 w-0 overflow-hidden opacity-0"
      />

      <div bind:this={turnstileEl} data-testid="contact-form-turnstile"></div>

      {#if status === 'error'}
        <p data-testid="contact-form-error" role="alert" class="text-sm text-red-600">
          {errorMessage}
        </p>
      {/if}

      <button
        data-testid="contact-form-submit"
        type="submit"
        disabled={!canSubmit}
        class="inline-flex items-center justify-center self-start bg-accent px-7 py-4 font-display font-bold uppercase tracking-[0.16em] text-accent-foreground transition-colors duration-(--duration-snap) ease-soft hover:bg-accent/85 disabled:opacity-50"
      >
        {status === 'submitting'
          ? contactFormConstants.submitBusyLabel
          : contactFormConstants.submitIdleLabel}
      </button>
    </form>
  {/if}
</div>
