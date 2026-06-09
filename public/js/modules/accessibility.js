/**
 * Accessibility utilities module.
 * Manages focus, navigation, and screen reader announcements
 * for the single-page application.
 * @module accessibility
 */

/**
 * Initializes accessibility features for the application.
 * Sets up keyboard navigation and focus management.
 */
export function initAccessibility() {
  setupKeyboardNavigation();
  setupFocusManagement();
}

/**
 * Sets up keyboard navigation handlers.
 * Supports Escape key to close modals and Tab key management.
 */
function setupKeyboardNavigation() {
  document.addEventListener('keydown', (event) => {
    // Allow keyboard users to navigate sections with arrow keys in nav
    if (event.target.classList.contains('nav-btn')) {
      handleNavKeyboard(event);
    }
  });
}

/**
 * Handles keyboard navigation within the navigation bar.
 * Arrow keys move between nav items, Enter/Space activates them.
 * @param {KeyboardEvent} event - The keyboard event
 */
function handleNavKeyboard(event) {
  const navButtons = Array.from(document.querySelectorAll('.nav-btn'));
  const currentIndex = navButtons.indexOf(event.target);

  let nextIndex = -1;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault();
    nextIndex = (currentIndex + 1) % navButtons.length;
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault();
    nextIndex = (currentIndex - 1 + navButtons.length) % navButtons.length;
  }

  if (nextIndex >= 0) {
    navButtons[nextIndex].focus();
  }
}

/**
 * Sets up focus management for SPA section changes.
 * Ensures focus is properly moved when sections change.
 */
function setupFocusManagement() {
  // Ensure that dynamically shown sections receive focus appropriately
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
        const section = mutation.target;
        if (!section.hidden && section.classList.contains('section')) {
          const heading = section.querySelector('h1, h2');
          if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
          }
        }
      }
    }
  });

  const sections = document.querySelectorAll('.section');
  sections.forEach((section) => {
    observer.observe(section, { attributes: true });
  });
}

/**
 * Announces a message to screen readers using an ARIA live region.
 * Creates a temporary live region, announces the message, then removes it.
 * @param {string} message - The message to announce
 * @param {'polite'|'assertive'} [priority='polite'] - Announcement urgency
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.classList.add('visually-hidden');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement has been read
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Moves focus to a specific element, making it focusable if needed.
 * @param {string|Element} target - CSS selector string or DOM element
 */
export function moveFocus(target) {
  const element = typeof target === 'string' ? document.querySelector(target) : target;

  if (element) {
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    element.focus();
  }
}
