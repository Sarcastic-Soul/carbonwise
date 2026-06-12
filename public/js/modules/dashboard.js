/**
 * Dashboard module — updates the visual dashboard with footprint data.
 * Manages all dashboard widgets: total footprint, category breakdown bars,
 * equivalency comparisons, and benchmark charts.
 * @module dashboard
 */

/**
 * Updates all dashboard widgets with calculated footprint data.
 * Acts as the single entry point for dashboard state changes.
 * @param {Object} data - Calculated footprint data from the API
 */
export function updateDashboard(data) {
  if (!data) {
    return;
  }
  updateTotalFootprint(data);
  updateBreakdownBars(data);
  updateEquivalencies(data);
  updateBenchmark(data);
}

/**
 * Updates the total footprint display card with the annual tonnage
 * and a contextual message comparing to the global average.
 * @param {Object} data - Calculated footprint data
 */
function updateTotalFootprint(data) {
  const el = document.getElementById('total-footprint');
  const ctx = document.getElementById('footprint-context');
  if (el) {
    el.textContent = data.totalTonnes.toFixed(2);
  }
  if (ctx) {
    const status =
      data.totalTonnes <= 4.7
        ? 'Below the global average — great job!'
        : 'Above the global average of 4.7 tonnes.';
    ctx.textContent = status;
  }
}

/**
 * Updates the category breakdown bar chart.
 * Normalizes all bars relative to the highest-emission category.
 * @param {Object} data - Calculated footprint data with breakdown
 */
function updateBreakdownBars(data) {
  const categories = ['transport', 'energy', 'diet', 'shopping'];
  const maxKg = Math.max(...categories.map((c) => data.breakdown[c]?.kg || 0), 1);

  for (const cat of categories) {
    const bar = document.getElementById(`bar-${cat}`);
    const val = document.getElementById(`val-${cat}`);
    const container = bar?.parentElement;
    const kg = data.breakdown[cat]?.kg || 0;
    const pct = Math.round((kg / maxKg) * 100);

    if (bar) {
      bar.style.width = `${pct}%`;
    }
    if (val) {
      val.textContent = `${kg} kg`;
    }
    if (container) {
      container.setAttribute('aria-valuenow', String(pct));
    }
  }
}

/**
 * Updates the equivalency cards (trees, driving km, flights, smartphone charges)
 * with values derived from the user's total emissions.
 * @param {Object} data - Calculated footprint data with equivalencies
 */
function updateEquivalencies(data) {
  if (!data.equivalencies) {
    return;
  }

  /** @type {Record<string, string>} Maps API equivalency keys to DOM element IDs */
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

/**
 * Updates the benchmark comparison chart.
 * Scales the user's bar relative to the USA average (15.5t) as the maximum.
 * @param {Object} data - Calculated footprint data
 */
function updateBenchmark(data) {
  const bar = document.getElementById('benchmark-you-bar');
  const val = document.getElementById('benchmark-you-value');
  if (bar) {
    const pct = Math.min(Math.round((data.totalTonnes / 15.5) * 100), 100);
    bar.style.width = `${pct}%`;
  }
  if (val) {
    val.textContent = `${data.totalTonnes}t`;
  }
}

/**
 * Loads the latest saved footprint data from localStorage on app initialization.
 * Silently ignores errors if localStorage is unavailable.
 */
export function loadSavedDashboard() {
  try {
    const saved = localStorage.getItem('carbonwise_latest');
    if (saved) {
      updateDashboard(JSON.parse(saved));
    }
  } catch (_e) {
    // Ignore — localStorage may be unavailable
  }
}
