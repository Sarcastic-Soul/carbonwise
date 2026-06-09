/**
 * Dashboard module — updates the visual dashboard with footprint data.
 * @module dashboard
 */

/**
 * Updates all dashboard widgets with calculated footprint data.
 * @param {Object} data - Calculated footprint data from the API
 */
export function updateDashboard(data) {
  if (!data) { return; }
  updateTotalFootprint(data);
  updateBreakdownBars(data);
  updateEquivalencies(data);
  updateBenchmark(data);
}

function updateTotalFootprint(data) {
  const el = document.getElementById('total-footprint');
  const ctx = document.getElementById('footprint-context');
  if (el) { el.textContent = data.totalTonnes.toFixed(2); }
  if (ctx) {
    const status = data.totalTonnes <= 4.7 ? 'Below the global average — great job!' : 'Above the global average of 4.7 tonnes.';
    ctx.textContent = status;
  }
}

function updateBreakdownBars(data) {
  const categories = ['transport', 'energy', 'diet', 'shopping'];
  const maxKg = Math.max(...categories.map((c) => data.breakdown[c]?.kg || 0), 1);

  for (const cat of categories) {
    const bar = document.getElementById(`bar-${cat}`);
    const val = document.getElementById(`val-${cat}`);
    const container = bar?.parentElement;
    const kg = data.breakdown[cat]?.kg || 0;
    const pct = Math.round((kg / maxKg) * 100);

    if (bar) { bar.style.width = `${pct}%`; }
    if (val) { val.textContent = `${kg} kg`; }
    if (container) {
      container.setAttribute('aria-valuenow', String(pct));
    }
  }
}

function updateEquivalencies(data) {
  if (!data.equivalencies) { return; }
  const mapping = {
    trees_per_year: 'equiv-trees',
    driving_km: 'equiv-driving',
    flights_domestic: 'equiv-flights',
    smartphone_charges: 'equiv-charges',
  };
  for (const [key, elId] of Object.entries(mapping)) {
    const el = document.getElementById(elId);
    if (el && data.equivalencies[key]) {
      el.textContent = data.equivalencies[key].value;
    }
  }
}

function updateBenchmark(data) {
  const bar = document.getElementById('benchmark-you-bar');
  const val = document.getElementById('benchmark-you-value');
  if (bar) {
    const pct = Math.min(Math.round((data.totalTonnes / 15.5) * 100), 100);
    bar.style.width = `${pct}%`;
  }
  if (val) { val.textContent = `${data.totalTonnes}t`; }
}

/**
 * Loads the latest saved data from localStorage on app init.
 */
export function loadSavedDashboard() {
  try {
    const saved = localStorage.getItem('carbonwise_latest');
    if (saved) { updateDashboard(JSON.parse(saved)); }
  } catch (_e) { /* ignore */ }
}
