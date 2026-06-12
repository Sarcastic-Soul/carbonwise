/**
 * Tips module — manages AI-generated personalized eco tips.
 * Fetches tips from the Gemini-powered backend and renders them
 * with markdown formatting via DOMPurify + Marked.
 * @module tips
 */

import { getPersonalizedTips } from '../utils/api.js';
import { getLastCalculation } from './calculator.js';
import { announceToScreenReader } from './accessibility.js';

/**
 * Initializes the tips module by binding the generate button handler.
 */
export function initTips() {
  const btn = document.getElementById('generate-tips-btn');
  if (btn) {
    btn.addEventListener('click', handleGenerateTips);
  }
}

/**
 * Checks whether footprint data is available and toggles the tips UI accordingly.
 * If cached tips exist, renders them immediately; otherwise shows the generate button.
 */
export function checkTipsAvailability() {
  const data = getLastCalculation() || loadLatestFromStorage();
  const prompt = document.getElementById('tips-prompt');
  const btn = document.getElementById('generate-tips-btn');
  const content = document.getElementById('tips-content');

  if (data && data.totalTonnes > 0) {
    if (prompt) {
      prompt.hidden = true;
    }

    // Check if we have cached tips from a previous generation
    const cachedTips = localStorage.getItem('carbonwise_tips');
    if (cachedTips && content) {
      content.innerHTML = window.DOMPurify.sanitize(window.marked.parse(cachedTips));
      content.hidden = false;
      if (btn) {
        btn.textContent = 'Regenerate My Tips';
        btn.hidden = false;
      }
    } else {
      if (btn) {
        btn.textContent = 'Generate My Tips';
        btn.hidden = false;
      }
      if (content) {
        content.hidden = true;
      }
    }
  } else {
    if (prompt) {
      prompt.hidden = false;
    }
    if (btn) {
      btn.hidden = true;
    }
    if (content) {
      content.hidden = true;
    }
  }
}

/**
 * Handles the "Generate My Tips" button click.
 * Sends footprint data to the backend, renders the AI-generated tips,
 * and caches them locally for re-display.
 */
async function handleGenerateTips() {
  const btn = document.getElementById('generate-tips-btn');
  const loading = document.getElementById('tips-loading');
  const content = document.getElementById('tips-content');
  const data = getLastCalculation() || loadLatestFromStorage();

  if (!data) {
    return;
  }

  if (btn) {
    btn.hidden = true;
  }
  if (loading) {
    loading.hidden = false;
  }
  if (content) {
    content.hidden = true;
  }

  try {
    const result = await getPersonalizedTips(data);
    const tips = result.data?.tips || 'No tips could be generated.';

    if (content) {
      content.innerHTML = window.DOMPurify.sanitize(window.marked.parse(tips));
      content.hidden = false;
      localStorage.setItem('carbonwise_tips', tips);
    }
    if (btn) {
      btn.textContent = 'Regenerate My Tips';
    }
    announceToScreenReader('Personalized eco tips have been generated.');
  } catch (error) {
    if (content) {
      content.innerHTML = `<p class="error-text">Failed to generate tips: ${window.DOMPurify.sanitize(error.message)}</p>`;
      content.hidden = false;
    }
    announceToScreenReader('Error generating tips.');
  } finally {
    if (loading) {
      loading.hidden = true;
    }
    if (btn) {
      btn.hidden = false;
    }
  }
}

/**
 * Loads the latest footprint calculation from localStorage.
 * @returns {Object|null} The parsed footprint data, or null if unavailable
 */
function loadLatestFromStorage() {
  try {
    const saved = localStorage.getItem('carbonwise_latest');
    return saved ? JSON.parse(saved) : null;
  } catch (_e) {
    return null;
  }
}
