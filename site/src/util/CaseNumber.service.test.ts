import { describe, expect, it } from 'vitest';
import caseNumberService from './CaseNumber.service';

describe('CaseNumberService', () => {
  describe('forCourse', () => {
    it('combines the padded position with the initials of significant slug words', () => {
      expect(caseNumberService.forCourse('fire-origin-and-cause-fundamentals', 0)).toBe(
        'II-001-FOCF'
      );
    });

    it('caps the initials at four letters', () => {
      expect(caseNumberService.forCourse('one-two-three-four-five', 11)).toBe('II-012-OTTF');
    });

    it('omits the suffix when the slug has no significant words', () => {
      expect(caseNumberService.forCourse('the-and', 2)).toBe('II-003');
    });
  });
});
