/**
 * Client-side sanitization utility.
 * Prevents XSS by escaping HTML entities in user-generated content
 * before rendering it in the DOM.
 * @module sanitizer
 */

/**
 * HTML entity map for escaping dangerous characters.
 * @type {Object.<string, string>}
 */
const HTML_ENTITIES = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
});

/**
 * Escapes HTML entities in a string to prevent XSS attacks.
 * @param {string} text - The raw text to sanitize
 * @returns {string} Sanitized text with HTML entities escaped
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Converts markdown-like text to safe HTML for rendering.
 * Supports: bold, italic, headers, bullet lists, numbered lists, code blocks, and paragraphs.
 * All text content is HTML-escaped before processing.
 * @param {string} markdown - Raw markdown text
 * @returns {string} Safe HTML string
 */
export function markdownToSafeHtml(markdown) {
  if (typeof markdown !== 'string' || markdown.trim() === '') {
    return '';
  }

  const lines = markdown.split('\n');
  let html = '';
  let inList = false;
  let inOrderedList = false;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        html += '</code></pre>';
        inCodeBlock = false;
      } else {
        html += '<pre><code>';
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      html += `${escapeHtml(line)}\n`;
      continue;
    }

    // Close open lists if line is not a list item
    if (inList && !line.trim().startsWith('- ') && !line.trim().startsWith('* ')) {
      html += '</ul>';
      inList = false;
    }
    if (inOrderedList && !/^\d+\.\s/.test(line.trim())) {
      html += '</ol>';
      inOrderedList = false;
    }

    const trimmed = line.trim();

    // Empty lines
    if (trimmed === '') {
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      html += `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
    } else if (trimmed.startsWith('## ')) {
      html += `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
    } else if (trimmed.startsWith('# ')) {
      html += `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
    }
    // Unordered list
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${formatInlineMarkdown(trimmed.slice(2))}</li>`;
    }
    // Ordered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (!inOrderedList) {
        html += '<ol>';
        inOrderedList = true;
      }
      const content = trimmed.replace(/^\d+\.\s/, '');
      html += `<li>${formatInlineMarkdown(content)}</li>`;
    }
    // Regular paragraph
    else {
      html += `<p>${formatInlineMarkdown(trimmed)}</p>`;
    }
  }

  // Close any open elements
  if (inList) { html += '</ul>'; }
  if (inOrderedList) { html += '</ol>'; }
  if (inCodeBlock) { html += '</code></pre>'; }

  return html;
}

/**
 * Formats inline markdown elements (bold, italic, inline code).
 * Escapes HTML first, then applies safe formatting.
 * @param {string} text - Text with potential inline markdown
 * @returns {string} Formatted HTML string
 */
function formatInlineMarkdown(text) {
  let safe = escapeHtml(text);
  // Bold: **text**
  safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code: `text`
  safe = safe.replace(/`(.+?)`/g, '<code>$1</code>');
  return safe;
}
