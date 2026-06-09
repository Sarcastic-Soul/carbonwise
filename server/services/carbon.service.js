import {
  TRANSPORT_FACTORS,
  ENERGY_FACTORS,
  DIET_FACTORS,
  SHOPPING_FACTORS,
  EQUIVALENCY_FACTORS,
  BENCHMARK_AVERAGES,
  APP_CONSTANTS,
} from '../utils/constants.js';
import { roundTo, kgToTonnes, isPositiveNumber } from '../utils/helpers.js';
import { logger } from '../utils/logger.js';

/**
 * Carbon footprint calculation service.
 * Provides methods to calculate emissions for individual activities
 * and comprehensive footprint assessments.
 * All calculations use science-based emission factors (EPA, DEFRA, IPCC).
 * @module CarbonService
 */

/**
 * Frequency multipliers to convert activity frequency to annual totals.
 * @type {Object.<string, number>}
 */
const FREQUENCY_MULTIPLIERS = Object.freeze({
  daily: APP_CONSTANTS.DAYS_IN_YEAR,
  weekly: APP_CONSTANTS.WEEKS_IN_YEAR,
  monthly: APP_CONSTANTS.MONTHS_IN_YEAR,
  yearly: 1,
});

/**
 * Calculates annual CO₂e emissions for a transportation activity.
 * @param {string} type - Transport type key (e.g., 'car_gasoline', 'bus')
 * @param {number} distance - Distance per trip in kilometers
 * @param {string} frequency - Trip frequency ('daily', 'weekly', 'monthly', 'yearly')
 * @returns {{kg: number, tonnes: number, label: string}|null} Emission result or null if invalid input
 */
export function calculateTransportEmissions(type, distance, frequency) {
  const factor = TRANSPORT_FACTORS[type];
  if (!factor) {
    logger.warn('Unknown transport type', { type });
    return null;
  }

  if (!isPositiveNumber(distance)) {
    return null;
  }

  const multiplier = FREQUENCY_MULTIPLIERS[frequency] || 1;
  const annualKg = roundTo(factor.factor * distance * multiplier);

  return {
    kg: annualKg,
    tonnes: kgToTonnes(annualKg),
    label: factor.label,
  };
}

/**
 * Calculates annual CO₂e emissions for home energy usage.
 * @param {string} type - Energy type key (e.g., 'electricity', 'natural_gas')
 * @param {number} amount - Monthly usage in the source's unit
 * @returns {{kg: number, tonnes: number, label: string, unit: string}|null} Emission result or null
 */
export function calculateEnergyEmissions(type, amount) {
  const factor = ENERGY_FACTORS[type];
  if (!factor) {
    logger.warn('Unknown energy type', { type });
    return null;
  }

  if (!isPositiveNumber(amount)) {
    return null;
  }

  const annualKg = roundTo(factor.factor * amount * APP_CONSTANTS.MONTHS_IN_YEAR);

  return {
    kg: annualKg,
    tonnes: kgToTonnes(annualKg),
    label: factor.label,
    unit: factor.unit,
  };
}

/**
 * Calculates annual CO₂e emissions based on dietary choices.
 * @param {string} dietType - Diet type key (e.g., 'vegan', 'high_meat')
 * @returns {{kg: number, tonnes: number, label: string}|null} Emission result or null
 */
export function calculateDietEmissions(dietType) {
  const factor = DIET_FACTORS[dietType];
  if (!factor) {
    logger.warn('Unknown diet type', { dietType });
    return null;
  }

  const annualKg = roundTo(factor.factor * APP_CONSTANTS.DAYS_IN_YEAR);

  return {
    kg: annualKg,
    tonnes: kgToTonnes(annualKg),
    label: factor.label,
  };
}

/**
 * Calculates annual CO₂e emissions from shopping/consumption.
 * @param {string} type - Shopping category key (e.g., 'clothing', 'electronics_small')
 * @param {number} quantity - Number of items purchased per month
 * @returns {{kg: number, tonnes: number, label: string}|null} Emission result or null
 */
export function calculateShoppingEmissions(type, quantity) {
  const factor = SHOPPING_FACTORS[type];
  if (!factor) {
    logger.warn('Unknown shopping type', { type });
    return null;
  }

  if (!isPositiveNumber(quantity)) {
    return null;
  }

  const annualKg = roundTo(factor.factor * quantity * APP_CONSTANTS.MONTHS_IN_YEAR);

  return {
    kg: annualKg,
    tonnes: kgToTonnes(annualKg),
    label: factor.label,
  };
}

/**
 * Calculates a comprehensive carbon footprint from multiple activity categories.
 * Returns detailed breakdown by category and overall totals.
 * @param {Object} activities - User activity data
 * @param {Object} [activities.transport] - Transportation data
 * @param {Object} [activities.energy] - Energy usage data
 * @param {string} [activities.diet] - Diet type
 * @param {Object} [activities.shopping] - Shopping data
 * @returns {Object} Comprehensive footprint with breakdowns, totals, and equivalencies
 */
export function calculateTotalFootprint(activities) {
  const breakdown = {
    transport: null,
    energy: null,
    diet: null,
    shopping: null,
  };

  let totalKg = 0;

  // Calculate each category
  if (activities.transport && activities.transport.type) {
    breakdown.transport = calculateTransportEmissions(
      activities.transport.type,
      activities.transport.distance || 0,
      activities.transport.frequency || 'daily'
    );
    if (breakdown.transport) {
      totalKg += breakdown.transport.kg;
    }
  }

  if (activities.energy && activities.energy.type) {
    breakdown.energy = calculateEnergyEmissions(
      activities.energy.type,
      activities.energy.amount || 0
    );
    if (breakdown.energy) {
      totalKg += breakdown.energy.kg;
    }
  }

  if (activities.diet) {
    breakdown.diet = calculateDietEmissions(activities.diet);
    if (breakdown.diet) {
      totalKg += breakdown.diet.kg;
    }
  }

  if (activities.shopping && activities.shopping.type) {
    breakdown.shopping = calculateShoppingEmissions(
      activities.shopping.type,
      activities.shopping.quantity || 0
    );
    if (breakdown.shopping) {
      totalKg += breakdown.shopping.kg;
    }
  }

  const totalTonnes = kgToTonnes(totalKg);

  return {
    totalKg: roundTo(totalKg),
    totalTonnes,
    breakdown,
    equivalencies: calculateEquivalencies(totalKg),
    comparison: compareWithBenchmarks(totalTonnes),
  };
}

/**
 * Converts a kg CO₂e value into intuitive real-world equivalencies.
 * Helps users understand their impact in relatable terms.
 * @param {number} totalKg - Total emissions in kg CO₂e
 * @returns {Object.<string, {value: number, label: string, unit: string}>} Equivalency breakdown
 */
export function calculateEquivalencies(totalKg) {
  if (!isPositiveNumber(totalKg)) {
    return {};
  }

  const totalTonnes = totalKg / 1000;
  const result = {};

  for (const [key, data] of Object.entries(EQUIVALENCY_FACTORS)) {
    result[key] = {
      value: roundTo(totalTonnes * data.factor),
      label: data.label,
      unit: data.unit,
    };
  }

  return result;
}

/**
 * Compares a user's footprint against national and global benchmarks.
 * @param {number} userTonnes - User's annual emissions in tonnes CO₂e
 * @returns {Object} Comparison data with percentage differences
 */
export function compareWithBenchmarks(userTonnes) {
  if (!isPositiveNumber(userTonnes)) {
    return { benchmarks: BENCHMARK_AVERAGES, userTonnes: 0 };
  }

  const comparisons = {};

  for (const [region, average] of Object.entries(BENCHMARK_AVERAGES)) {
    const difference = roundTo(userTonnes - average);
    const percentDiff = average > 0 ? roundTo(((userTonnes - average) / average) * 100) : 0;

    comparisons[region] = {
      average,
      difference,
      percentDifference: percentDiff,
      status: difference <= 0 ? 'below_average' : 'above_average',
    };
  }

  return {
    userTonnes: roundTo(userTonnes),
    comparisons,
  };
}

/**
 * Returns all available emission factor categories for the calculator UI.
 * @returns {Object} All factor categories with their options
 */
export function getAvailableFactors() {
  return {
    transport: Object.entries(TRANSPORT_FACTORS).map(([key, data]) => ({
      key,
      label: data.label,
      unit: data.unit,
      factor: data.factor,
    })),
    energy: Object.entries(ENERGY_FACTORS).map(([key, data]) => ({
      key,
      label: data.label,
      unit: data.unit,
      factor: data.factor,
    })),
    diet: Object.entries(DIET_FACTORS).map(([key, data]) => ({
      key,
      label: data.label,
      dailyKg: data.factor,
    })),
    shopping: Object.entries(SHOPPING_FACTORS).map(([key, data]) => ({
      key,
      label: data.label,
      factorPerItem: data.factor,
    })),
    frequencies: Object.keys(FREQUENCY_MULTIPLIERS),
  };
}
