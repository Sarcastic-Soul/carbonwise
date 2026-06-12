/**
 * @jest-environment jsdom
 */
/* eslint-env browser, jest */

/**
 * Frontend unit tests for the Calculator module.
 * Runs in jsdom to simulate browser DOM environment.
 */

import { getLastCalculation } from '../../public/js/modules/calculator.js';

describe('Calculator Frontend Module', () => {
  beforeEach(() => {
    // Set up minimal DOM required by initCalculator
    document.body.innerHTML = `
      <form id="calculator-form">
        <button id="calculate-btn">Calculate</button>
      </form>
      <div id="calculator-results"></div>
      <div id="results-summary"></div>
    `;
  });

  test('getLastCalculation returns null initially', () => {
    const result = getLastCalculation();
    expect(result).toBeNull();
  });
});
