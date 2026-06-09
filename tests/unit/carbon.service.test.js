/**
 * Unit tests for CarbonService.
 * Tests emission calculations for all categories using science-based factors.
 */

import { jest } from '@jest/globals';
import {
  calculateTransportEmissions,
  calculateEnergyEmissions,
  calculateDietEmissions,
  calculateShoppingEmissions,
  calculateTotalFootprint,
  calculateEquivalencies,
  compareWithBenchmarks,
  getAvailableFactors,
} from '../../server/services/carbon.service.js';

describe('CarbonService', () => {
  describe('calculateTransportEmissions', () => {
    it('should calculate car gasoline emissions correctly', () => {
      const result = calculateTransportEmissions('car_gasoline', 30, 'daily');
      expect(result).not.toBeNull();
      expect(result.kg).toBeCloseTo(0.21 * 30 * 365, 1);
      expect(result.label).toBe('Car (Gasoline)');
    });

    it('should calculate weekly frequency correctly', () => {
      const result = calculateTransportEmissions('bus', 10, 'weekly');
      expect(result).not.toBeNull();
      expect(result.kg).toBeCloseTo(0.089 * 10 * 52, 1);
    });

    it('should return zero for bicycle', () => {
      const result = calculateTransportEmissions('bicycle', 20, 'daily');
      expect(result).not.toBeNull();
      expect(result.kg).toBe(0);
    });

    it('should return null for unknown transport type', () => {
      const result = calculateTransportEmissions('spaceship', 100, 'daily');
      expect(result).toBeNull();
    });

    it('should return null for negative distance', () => {
      const result = calculateTransportEmissions('car_gasoline', -10, 'daily');
      expect(result).toBeNull();
    });

    it('should return null for non-number distance', () => {
      const result = calculateTransportEmissions('car_gasoline', 'abc', 'daily');
      expect(result).toBeNull();
    });
  });

  describe('calculateEnergyEmissions', () => {
    it('should calculate electricity emissions correctly', () => {
      const result = calculateEnergyEmissions('electricity', 300);
      expect(result).not.toBeNull();
      expect(result.kg).toBeCloseTo(0.42 * 300 * 12, 1);
      expect(result.unit).toBe('kWh');
    });

    it('should return zero for solar', () => {
      const result = calculateEnergyEmissions('solar', 500);
      expect(result).not.toBeNull();
      expect(result.kg).toBe(0);
    });

    it('should return null for unknown energy type', () => {
      expect(calculateEnergyEmissions('nuclear', 100)).toBeNull();
    });
  });

  describe('calculateDietEmissions', () => {
    it('should calculate vegan diet emissions', () => {
      const result = calculateDietEmissions('vegan');
      expect(result).not.toBeNull();
      expect(result.kg).toBeCloseTo(2.89 * 365, 1);
    });

    it('should calculate high_meat diet emissions', () => {
      const result = calculateDietEmissions('high_meat');
      expect(result).not.toBeNull();
      expect(result.kg).toBeCloseTo(7.19 * 365, 1);
    });

    it('should return null for unknown diet', () => {
      expect(calculateDietEmissions('breatharian')).toBeNull();
    });
  });

  describe('calculateShoppingEmissions', () => {
    it('should calculate clothing emissions', () => {
      const result = calculateShoppingEmissions('clothing', 3);
      expect(result).not.toBeNull();
      expect(result.kg).toBeCloseTo(20 * 3 * 12, 1);
    });

    it('should return null for negative quantity', () => {
      expect(calculateShoppingEmissions('clothing', -1)).toBeNull();
    });
  });

  describe('calculateTotalFootprint', () => {
    it('should calculate comprehensive footprint', () => {
      const result = calculateTotalFootprint({
        transport: { type: 'car_gasoline', distance: 20, frequency: 'daily' },
        diet: 'medium_meat',
      });
      expect(result.totalKg).toBeGreaterThan(0);
      expect(result.totalTonnes).toBeGreaterThan(0);
      expect(result.breakdown.transport).not.toBeNull();
      expect(result.breakdown.diet).not.toBeNull();
      expect(result.equivalencies).toBeDefined();
      expect(result.comparison).toBeDefined();
    });

    it('should handle empty activities', () => {
      const result = calculateTotalFootprint({});
      expect(result.totalKg).toBe(0);
      expect(result.totalTonnes).toBe(0);
    });
  });

  describe('calculateEquivalencies', () => {
    it('should return equivalencies for positive value', () => {
      const result = calculateEquivalencies(5000);
      expect(result.trees_per_year).toBeDefined();
      expect(result.trees_per_year.value).toBeGreaterThan(0);
    });

    it('should return zero values for zero input', () => {
      const result = calculateEquivalencies(0);
      expect(result.trees_per_year).toBeDefined();
      expect(result.trees_per_year.value).toBe(0);
    });
  });

  describe('compareWithBenchmarks', () => {
    it('should compare against all benchmarks', () => {
      const result = compareWithBenchmarks(5.0);
      expect(result.userTonnes).toBe(5.0);
      expect(result.comparisons.global).toBeDefined();
      expect(result.comparisons.usa).toBeDefined();
    });
  });

  describe('getAvailableFactors', () => {
    it('should return all factor categories', () => {
      const factors = getAvailableFactors();
      expect(factors.transport).toBeInstanceOf(Array);
      expect(factors.energy).toBeInstanceOf(Array);
      expect(factors.diet).toBeInstanceOf(Array);
      expect(factors.shopping).toBeInstanceOf(Array);
      expect(factors.frequencies).toBeInstanceOf(Array);
      expect(factors.transport.length).toBeGreaterThan(0);
    });
  });
});
