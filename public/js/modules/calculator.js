/**
 * Calculator module — manages the carbon footprint calculator form and results.
 * Handles form submission, data gathering, result rendering, and local persistence.
 * @module calculator
 */

import { calculateFootprint } from '../utils/api.js';
import { announceToScreenReader } from './accessibility.js';
import { updateDashboard } from './dashboard.js';

/** @type {Object|null} Most recent footprint calculation result */
let lastCalculation = null;

/**
 * Returns the most recent calculation result for use by other modules.
 * @returns {Object|null} The last footprint calculation result, or null
 */
export function getLastCalculation() {
  return lastCalculation;
}

/**
 * Initializes the calculator module.
 * Sets up form submission handler, reset handler, and restores the last calculation
 * from localStorage if available.
 */
export function initCalculator() {
  const form = document.getElementById('calculator-form');
  if (!form) {
    return;
  }

  // Restore last calculation from localStorage if available
  try {
    const saved = localStorage.getItem('carbonwise_latest');
    if (saved) {
      lastCalculation = JSON.parse(saved);
    }
  } catch (_e) {
    // localStorage may be unavailable in private browsing or restricted contexts
  }

  form.addEventListener('submit', handleCalculatorSubmit);
  form.addEventListener('reset', () => {
    const resultsDiv = document.getElementById('calculator-results');
    if (resultsDiv) {
      resultsDiv.hidden = true;
    }
    lastCalculation = null;
    try {
      localStorage.removeItem('carbonwise_latest');
      localStorage.removeItem('carbonwise_tips');
    } catch (_e) {
      // Ignore storage errors on reset
    }
  });
}

/**
 * Handles calculator form submission.
 * Validates the form, gathers activity data, calls the API, and renders results.
 * @param {Event} event - Form submit event
 */
async function handleCalculatorSubmit(event) {
  event.preventDefault();

  const form = document.getElementById('calculator-form');
  // Update aria-invalid attributes based on HTML5 validity
  Array.from(form.elements).forEach((el) => {
    if (el.willValidate) {
      el.setAttribute('aria-invalid', String(!el.validity.valid));
    }
  });

  if (!form.checkValidity()) {
    announceToScreenReader('Please fix the errors in the form.');
    return;
  }

  const submitBtn = document.getElementById('calculate-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Calculating...';
  }

  try {
    const activities = gatherFormData();
    const result = await calculateFootprint(activities);
    lastCalculation = result.data;
    renderResults(result.data);
    updateDashboard(result.data);
    saveToLocalStorage(result.data);
    announceToScreenReader(
      `Your annual carbon footprint is ${result.data.totalTonnes} tonnes CO2 equivalent.`
    );
  } catch (error) {
    const resultsDiv = document.getElementById('calculator-results');
    const summaryDiv = document.getElementById('results-summary');
    if (resultsDiv && summaryDiv) {
      const safeMessage = window.DOMPurify
        ? window.DOMPurify.sanitize(error.message)
        : error.message;
      summaryDiv.innerHTML = `<p class="error-text"><strong>Error:</strong> ${safeMessage}</p>`;
      resultsDiv.hidden = false;
    }
    announceToScreenReader('Error calculating footprint.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Calculate My Footprint';
    }
  }
}

/**
 * Gathers form input values into an activities data object suitable for the API.
 * Only includes categories where the user has selected a type.
 * @returns {Object} Activities data with transport, energy, diet, and shopping fields
 */
function gatherFormData() {
  const data = {};

  const transportType = document.getElementById('transport-type')?.value;
  if (transportType) {
    data.transport = {
      type: transportType,
      distance: parseFloat(document.getElementById('transport-distance')?.value) || 0,
      frequency: document.getElementById('transport-frequency')?.value || 'daily',
    };
  }

  const energyType = document.getElementById('energy-type')?.value;
  if (energyType) {
    data.energy = {
      type: energyType,
      amount: parseFloat(document.getElementById('energy-amount')?.value) || 0,
    };
  }

  const dietType = document.getElementById('diet-type')?.value;
  if (dietType) {
    data.diet = dietType;
  }

  const shoppingType = document.getElementById('shopping-type')?.value;
  if (shoppingType) {
    data.shopping = {
      type: shoppingType,
      quantity: parseInt(document.getElementById('shopping-quantity')?.value, 10) || 0,
    };
  }

  return data;
}

/**
 * Renders the calculation results into the results section.
 * Shows total footprint, category breakdown, and navigation prompts.
 * @param {Object} data - Calculated footprint data from the API
 */
function renderResults(data) {
  const resultsDiv = document.getElementById('calculator-results');
  const summaryDiv = document.getElementById('results-summary');
  if (!resultsDiv || !summaryDiv) {
    return;
  }

  const categories = ['transport', 'energy', 'diet', 'shopping'];
  let html = `<p><strong>Annual footprint:</strong> <span class="highlight-text">${data.totalTonnes} tonnes CO₂e</span> (${data.totalKg} kg)</p><h3>Breakdown</h3><ul>`;

  for (const cat of categories) {
    if (data.breakdown[cat]) {
      html += `<li><strong>${data.breakdown[cat].label}:</strong> ${data.breakdown[cat].kg} kg/year</li>`;
    }
  }

  html +=
    '</ul><p>Check your <strong>Dashboard</strong> for comparisons or <strong>Eco Tips</strong> for recommendations.</p>';
  summaryDiv.innerHTML = html;
  resultsDiv.hidden = false;
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Persists calculation data to localStorage and the backend history API.
 * Maintains a rolling history of the last 10 calculations.
 * @param {Object} data - Calculated footprint data to persist
 */
async function saveToLocalStorage(data) {
  try {
    const existing = JSON.parse(localStorage.getItem('carbonwise_history') || '[]');
    existing.push({ timestamp: new Date().toISOString(), ...data });
    localStorage.setItem('carbonwise_history', JSON.stringify(existing.slice(-10)));
    localStorage.setItem('carbonwise_latest', JSON.stringify(data));
    localStorage.removeItem('carbonwise_tips'); // Clear outdated tips cache

    // Also persist to backend for cross-device access
    let sessionId = localStorage.getItem('carbonwise_session');
    if (!sessionId) {
      sessionId = `sess_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('carbonwise_session', sessionId);
    }

    await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': sessionId,
      },
      body: JSON.stringify({ data }),
    });
  } catch (_e) {
    // Silent fail — localStorage or network may be unavailable
  }
}
