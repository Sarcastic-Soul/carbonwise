/* eslint-env browser, jest */
/**
 * @jest-environment jsdom
 */
import { getLastCalculation } from '../../public/js/modules/calculator.js';

describe('Calculator Frontend Module', () => {
  beforeEach(() => {
    // Reset any mocks or DOM if needed
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
