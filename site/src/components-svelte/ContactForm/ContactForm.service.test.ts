import { afterEach, describe, expect, it, vi } from 'vitest';
import contactFormService from './ContactForm.service';
import { contactFormConstants } from './contactFormConstants';

const validPayload = {
  name: 'Alice',
  email: 'alice@example.com',
  message: 'Hello',
  website: '',
  turnstileToken: 'tok'
};

const courses = [
  { slug: 'scene-documentation', title: 'Scene Documentation' },
  { slug: 'cognitive-bias', title: 'Cognitive Bias in Fire Investigation' }
];

describe('ContactFormService', () => {
  describe('coursePrefill', () => {
    it('returns the course and a starter message naming it', () => {
      const prefill = contactFormService.coursePrefill('?course=cognitive-bias', courses);
      expect(prefill).toEqual({
        course: courses[1],
        message: contactFormConstants.courseStarterMessage('Cognitive Bias in Fire Investigation')
      });
      expect(prefill?.message).toContain('Cognitive Bias in Fire Investigation');
    });

    it('returns null without a course parameter', () => {
      expect(contactFormService.coursePrefill('', courses)).toBeNull();
    });

    it('returns null for an unknown course slug', () => {
      expect(contactFormService.coursePrefill('?course=not-a-course', courses)).toBeNull();
    });
  });

  describe('submit', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns ok on a 200 response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
      const result = await contactFormService.submit(validPayload);
      expect(result).toEqual({ ok: true });
    });

    it('returns the server error message on 5xx', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }));
      const result = await contactFormService.submit(validPayload);
      expect(result).toEqual({
        ok: false,
        kind: 'server',
        message: contactFormConstants.serverErrorMessage
      });
    });

    it("surfaces the worker's error string on 4xx", async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ field: 'email', error: 'Email is invalid' }), {
          status: 400
        })
      );
      const result = await contactFormService.submit(validPayload);
      expect(result).toEqual({
        ok: false,
        kind: 'validation',
        message: 'Email is invalid'
      });
    });

    it('falls back to the generic message on 4xx without an error field', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 400 }));
      const result = await contactFormService.submit(validPayload);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe(contactFormConstants.genericValidationMessage);
      }
    });

    it('returns the network error message when fetch rejects', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
      const result = await contactFormService.submit(validPayload);
      expect(result).toEqual({
        ok: false,
        kind: 'network',
        message: contactFormConstants.networkErrorMessage
      });
    });
  });
});
