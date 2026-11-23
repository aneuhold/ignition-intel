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
  { slug: 'fire-origin-and-cause-fundamentals', title: 'Fire Origin and Cause Fundamentals' },
  { slug: 'report-writing-and-testimony', title: 'Report Writing and Testimony' }
];

describe('ContactFormService', () => {
  describe('findCourse', () => {
    it('returns the course whose slug matches the course query parameter', () => {
      expect(contactFormService.findCourse('?course=report-writing-and-testimony', courses)).toBe(
        courses[1]
      );
    });

    it('returns undefined when the parameter is missing', () => {
      expect(contactFormService.findCourse('', courses)).toBeUndefined();
      expect(contactFormService.findCourse('?other=1', courses)).toBeUndefined();
    });

    it('returns undefined when no course has that slug', () => {
      expect(contactFormService.findCourse('?course=unknown', courses)).toBeUndefined();
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
