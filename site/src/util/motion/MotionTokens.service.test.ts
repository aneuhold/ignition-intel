import { describe, expect, it } from 'vitest';
import motionTokensService from './MotionTokens.service';

describe('MotionTokensService', () => {
  describe('parseDuration', () => {
    it('converts milliseconds and seconds to seconds', () => {
      expect(motionTokensService.parseDuration('150ms')).toBe(0.15);
      expect(motionTokensService.parseDuration(' 1.2s ')).toBe(1.2);
    });

    it('falls back for values it cannot read', () => {
      expect(motionTokensService.parseDuration('')).toBe(0.4);
    });
  });

  describe('parseCubicBezier', () => {
    it('extracts the four control points', () => {
      expect(motionTokensService.parseCubicBezier('cubic-bezier(0.2, 0.8, 0.2, 1)')).toBe(
        '0.2,0.8,0.2,1'
      );
    });

    it('falls back to linear for keywords', () => {
      expect(motionTokensService.parseCubicBezier('ease-in')).toBe('0,0,1,1');
    });
  });
});
