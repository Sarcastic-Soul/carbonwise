/**
 * Main application controller.
 * Initializes all modules and manages SPA section navigation.
 * @module app
 */

import { initAccessibility } from './modules/accessibility.js';
import { initChat } from './modules/chat.js';
import { initCalculator } from './modules/calculator.js';
import { loadSavedDashboard } from './modules/dashboard.js';
import { initTips, checkTipsAvailability } from './modules/tips.js';

/**
 * Initializes the entire application when the DOM is ready.
 */
document.addEventListener('DOMContentLoaded', () => {
  initAccessibility();
  initNavigation();
  initChat();
  initCalculator();
  initTips();
  loadSavedDashboard();
});

/**
 * Sets up SPA navigation between sections.
 * Uses data-section attributes on nav buttons and link buttons.
 */
function initNavigation() {
  // Main nav buttons and in-page link buttons
  document.querySelectorAll('[data-section]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = btn.dataset.section;
      window.location.hash = section;
    });
  });

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    const section = window.location.hash.slice(1) || 'dashboard';
    navigateToSection(section);
  });

  // Initial routing on page load
  const initialSection = window.location.hash.slice(1) || 'dashboard';
  navigateToSection(initialSection);
}

/**
 * Navigates to a specific section by name.
 * @param {string} sectionName - The section to show (dashboard, calculator, chat, tips)
 */
function navigateToSection(sectionName) {
  const validSections = ['dashboard', 'calculator', 'chat', 'tips'];
  const activeSection = validSections.includes(sectionName) ? sectionName : 'dashboard';

  // Hide all sections
  document.querySelectorAll('.section').forEach((section) => {
    section.hidden = true;
    section.classList.remove('active');
  });

  // Show target section
  const target = document.getElementById(`section-${activeSection}`);
  if (target) {
    target.hidden = false;
    target.classList.add('active');
  }

  // Update nav active state
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.remove('active');
    btn.removeAttribute('aria-current');
  });

  const activeBtn = document.querySelector(`.nav-btn[data-section="${activeSection}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.setAttribute('aria-current', 'page');
  }

  // Section-specific setup
  if (activeSection === 'tips') {
    checkTipsAvailability();
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
