/**
 * Unit tests for input validation middleware.
 * Tests validation rules and error handling.
 */

import { jest } from '@jest/globals';
import {
  sanitizeInput,
  truncateString,
  roundTo,
  kgToTonnes,
  isPositiveNumber,
  createSuccessResponse,
  createErrorResponse,
  generateRequestId,
} from '../../server/utils/helpers.js';

describe('Helpers', () => {
  describe('sanitizeInput', () => {
    it('should strip HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('alert("xss")hello');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should return empty string for non-string input', () => {
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput(null)).toBe('');
    });
  });

  describe('truncateString', () => {
    it('should truncate long strings', () => {
      expect(truncateString('hello world', 5)).toBe('hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncateString('hi', 10)).toBe('hi');
    });

    it('should handle empty/null input', () => {
      expect(truncateString(null, 5)).toBe('');
    });
  });

  describe('roundTo', () => {
    it('should round to 2 decimal places by default', () => {
      expect(roundTo(3.14159)).toBe(3.14);
    });

    it('should round to specified decimals', () => {
      expect(roundTo(3.14159, 3)).toBe(3.142);
    });

    it('should return 0 for NaN', () => {
      expect(roundTo(NaN)).toBe(0);
    });

    it('should return 0 for non-numbers', () => {
      expect(roundTo('abc')).toBe(0);
    });
  });

  describe('kgToTonnes', () => {
    it('should convert kg to tonnes', () => {
      expect(kgToTonnes(1000)).toBe(1);
      expect(kgToTonnes(5500)).toBe(5.5);
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(5)).toBe(true);
      expect(isPositiveNumber(0)).toBe(true);
    });

    it('should return false for negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      expect(isPositiveNumber('5')).toBe(false);
      expect(isPositiveNumber(Infinity)).toBe(false);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create standardized success response', () => {
      const res = createSuccessResponse({ id: 1 }, 'Done');
      expect(res.success).toBe(true);
      expect(res.message).toBe('Done');
      expect(res.data).toEqual({ id: 1 });
    });
  });

  describe('createErrorResponse', () => {
    it('should create standardized error response', () => {
      const res = createErrorResponse('Not found', 404);
      expect(res.success).toBe(false);
      expect(res.error.message).toBe('Not found');
      expect(res.error.statusCode).toBe(404);
    });
  });

  describe('generateRequestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
