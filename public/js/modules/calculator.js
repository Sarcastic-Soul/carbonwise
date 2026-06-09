/**
 * Calculator module — manages the carbon footprint calculator form and results.
 * @module calculator
 */

import { calculateFootprint } from '../utils/api.js';
import { announceToScreenReader } from './accessibility.js';
import { updateDashboard } from './dashboard.js';

/** @type {Object|null} */
let lastCalculation = null;

/** @returns {Object|null} The last footprint calculation result */
export function getLastCalculation() { return lastCalculation; }

/** Initializes the calculator module. */
export function initCalculator() {
  const form = document.getElementById('calculator-form');
  if (!form) { return; }

  // Load last calculation from localStorage if available
  try {
    const saved = localStorage.getItem('carbonwise_latest');
    if (saved) {
      lastCalculation = JSON.parse(saved);
    }
  } catch (_e) { /* ignore */ }

  form.addEventListener('submit', handleCalculatorSubmit);
  form.addEventListener('reset', () => {
    const r = document.getElementById('calculator-results');
    if (r) { r.hidden = true; }
    lastCalculation = null;
    try {
      localStorage.removeItem('carbonwise_latest');
      localStorage.removeItem('carbonwise_tips');
    } catch (_e) {}
  });
}

async function handleCalculatorSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('calculate-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Calculating...'; }

  try {
    const activities = gatherFormData();
    const result = await calculateFootprint(activities);
    lastCalculation = result.data;
    renderResults(result.data);
    updateDashboard(result.data);
    saveToLocalStorage(result.data);
    announceToScreenReader(`Your annual carbon footprint is ${result.data.totalTonnes} tonnes CO2 equivalent.`);
  } catch (error) {
    const r = document.getElementById('calculator-results');
    const s = document.getElementById('results-summary');
    if (r && s) { s.innerHTML = `<p style="color:var(--color-error)"><strong>Error:</strong> ${error.message}</p>`; r.hidden = false; }
    announceToScreenReader('Error calculating footprint.');
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Calculate My Footprint'; }
  }
}

function gatherFormData() {
  const data = {};
  const tt = document.getElementById('transport-type')?.value;
  if (tt) { data.transport = { type: tt, distance: parseFloat(document.getElementById('transport-distance')?.value) || 0, frequency: document.getElementById('transport-frequency')?.value || 'daily' }; }
  const et = document.getElementById('energy-type')?.value;
  if (et) { data.energy = { type: et, amount: parseFloat(document.getElementById('energy-amount')?.value) || 0 }; }
  const dt = document.getElementById('diet-type')?.value;
  if (dt) { data.diet = dt; }
  const st = document.getElementById('shopping-type')?.value;
  if (st) { data.shopping = { type: st, quantity: parseInt(document.getElementById('shopping-quantity')?.value, 10) || 0 }; }
  return data;
}

function renderResults(data) {
  const resultsDiv = document.getElementById('calculator-results');
  const summaryDiv = document.getElementById('results-summary');
  if (!resultsDiv || !summaryDiv) { return; }

  let html = `<p><strong>Annual footprint:</strong> <span style="font-size:1.5rem;color:var(--color-primary-dark)">${data.totalTonnes} tonnes CO₂e</span> (${data.totalKg} kg)</p><h3>Breakdown</h3><ul>`;
  for (const cat of ['transport','energy','diet','shopping']) {
    if (data.breakdown[cat]) { html += `<li><strong>${data.breakdown[cat].label}:</strong> ${data.breakdown[cat].kg} kg/year</li>`; }
  }
  html += '</ul><p>Check your <strong>Dashboard</strong> for comparisons or <strong>Eco Tips</strong> for recommendations.</p>';
  summaryDiv.innerHTML = html;
  resultsDiv.hidden = false;
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function saveToLocalStorage(data) {
  try {
    const existing = JSON.parse(localStorage.getItem('carbonwise_history') || '[]');
    existing.push({ timestamp: new Date().toISOString(), ...data });
    localStorage.setItem('carbonwise_history', JSON.stringify(existing.slice(-10)));
    localStorage.setItem('carbonwise_latest', JSON.stringify(data));
    localStorage.removeItem('carbonwise_tips'); // Clear outdated tips cache
  } catch (_e) { /* localStorage unavailable */ }
}
