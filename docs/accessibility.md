# ♿ CarbonWise Accessibility (WCAG 2.1 AA) Compliance Guide

This document maps the implementation of the **CarbonWise** platform directly to the **Web Content Accessibility Guidelines (WCAG) 2.1 AA** criteria.

---

## 1. Compliance Matrix

| WCAG 2.1 Success Criteria | Compliance Implementation in CarbonWise |
| :--- | :--- |
| **1.1.1 Non-text Content (Level A)** | All icons, avatars, and graphical emojis have `aria-hidden="true"`. Complex dashboard visualizations have descriptive textual equivalents linked via `aria-label`. |
| **1.3.1 Info and Relationships (Level A)** | Explicit HTML5 landmarks are used (`<header role="banner">`, `<main role="main">`, `<nav role="navigation">`, `<footer role="contentinfo">`, `<section>`). Every input element is paired with a matching `<label for="...">`. |
| **1.4.3 Contrast (Minimum) (Level AA)** | Colors used for text and charts meet the 4.5:1 contrast ratio against their backgrounds. Carbon category colors utilize dark HSL variations to ensure complete readability. |
| **2.1.1 Keyboard (Level A)** | Every functional control (buttons, links, select lists, input fields) can be navigated and triggered using a keyboard alone. The custom navigation menu utilizes arrow keys for direction switches. |
| **2.4.1 Bypass Blocks (Level A)** | A Skip Navigation Link (`#main-content`) is available at the top of the DOM structure, styled to become visible when receiving keyboard focus. |
| **2.4.7 Focus Visible (Level A)** | High-contrast outlines are applied to focused elements via `:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }`. |
| **3.3.2 Labels or Instructions (Level A)** | Form fields include descriptions linked via `aria-describedby` indicating acceptable values (e.g. valid distances or billing amounts). |
| **4.1.3 Status Messages (Level AA)** | Dynamic elements (e.g., results generation or chat updates) notify screen readers via custom `status` live regions (`aria-live="polite"`). |

---

## 2. Accessible Code Implementations

### Skip-Link Structure
```html
<!-- public/index.html -->
<a href="#main-content" class="skip-link" id="skip-nav">Skip to main content</a>
```
```css
/* public/css/design-system.css */
.skip-link {
  position: absolute;
  top: -100%;
  left: 50%;
  transform: translateX(-50%);
  padding: var(--space-sm) var(--space-lg);
  background: var(--color-primary);
  color: white;
  font-weight: 600;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  z-index: 1000;
  text-decoration: none;
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: 0;
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
```

### Screen Reader Live Announcements
To declare operations to visually impaired users dynamically without forcing a focus change, we inject temporary `aria-live` containers:

```javascript
// public/js/modules/accessibility.js
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.classList.add('visually-hidden');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove element after announcement is read by assistive technologies
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
```

### Keyboard Navigation for SPA Headers
The application enables arrow key navigation between sections in the navigation menu, mirroring desktop application behaviors:

```javascript
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
```
---

## 3. Screen Reader Testing Checklist

To verify accessibility parameters:
1. Turn on a screen reader (e.g. NVDA on Windows, VoiceOver on macOS).
2. Tab through all elements, verifying that the skip-link appears and works.
3. Verify that validation errors trigger announcements.
4. Check that chart elements are represented by detailed description labels.
