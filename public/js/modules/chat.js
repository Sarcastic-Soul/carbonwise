/**
 * Chat module — manages the AI assistant conversation interface.
 * Handles message sending, history management, and UI updates.
 * @module chat
 */

import { sendChatMessage } from '../utils/api.js';
import { announceToScreenReader } from './accessibility.js';

/** @type {Array<{role: string, parts: Array<{text: string}>}>} */
let conversationHistory = [];

/**
 * Initializes the chat module.
 * Sets up form submission, character counter, and input handlers.
 */
export function initChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const charCount = document.getElementById('chat-char-count');

  if (!form || !input) {
    return;
  }

  form.addEventListener('submit', handleChatSubmit);

  // Character counter
  input.addEventListener('input', () => {
    const count = input.value.length;
    if (charCount) {
      charCount.textContent = `${count} / 2000`;
    }
  });
}

/**
 * Handles chat form submission.
 * Sends the user's message, displays it, and renders the AI response.
 * @param {Event} event - Form submit event
 */
async function handleChatSubmit(event) {
  event.preventDefault();

  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send-btn');
  const message = input.value.trim();

  if (!message) {
    return;
  }

  // Disable input while processing
  input.disabled = true;
  sendBtn.disabled = true;

  // Display user message
  appendMessage('user', message);

  // Clear input
  input.value = '';
  const charCount = document.getElementById('chat-char-count');
  if (charCount) {
    charCount.textContent = '0 / 2000';
  }

  // Show typing indicator
  const typingId = showTypingIndicator();

  try {
    const result = await sendChatMessage(message, conversationHistory);
    const reply = result.data?.reply || 'Sorry, I could not generate a response.';

    // Remove typing indicator
    removeTypingIndicator(typingId);

    // Display assistant response
    appendMessage('assistant', reply);

    // Update conversation history
    conversationHistory.push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: reply }] }
    );

    // Keep history manageable (last 20 turns)
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    announceToScreenReader('CarbonWise has responded.');
  } catch (error) {
    removeTypingIndicator(typingId);
    appendMessage('assistant', `I'm sorry, something went wrong: ${window.DOMPurify.sanitize(error.message)}`);
    announceToScreenReader('Error: could not get a response.');
  } finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

/**
 * Appends a message to the chat interface.
 * @param {'user'|'assistant'} role - Message sender role
 * @param {string} content - Message content (supports markdown for assistant)
 */
function appendMessage(role, content) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) {
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', `message-${role}`);
  messageDiv.setAttribute('role', 'article');
  messageDiv.setAttribute('aria-label', `${role === 'user' ? 'Your' : 'Assistant'} message`);

  const avatar = document.createElement('div');
  avatar.classList.add('message-avatar');
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = role === 'user' ? '👤' : '🌍';

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');

  if (role === 'assistant') {
    contentDiv.innerHTML = window.DOMPurify.sanitize(window.marked.parse(content));
  } else {
    contentDiv.textContent = content;
  }

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  messagesContainer.appendChild(messageDiv);

  // Scroll to latest message
  const chatContainer = document.getElementById('chat-log');
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

/**
 * Shows a typing indicator in the chat.
 * @returns {string} ID of the typing indicator element
 */
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chat-messages');
  const id = `typing-${Date.now()}`;

  const typingDiv = document.createElement('div');
  typingDiv.id = id;
  typingDiv.classList.add('message', 'message-assistant');
  typingDiv.setAttribute('role', 'status');
  typingDiv.setAttribute('aria-label', 'Assistant is typing');

  typingDiv.innerHTML = `
    <div class="message-avatar" aria-hidden="true">🌍</div>
    <div class="message-content">
      <div class="loading">
        <div class="spinner" aria-hidden="true"></div>
        <p>Thinking...</p>
      </div>
    </div>
  `;

  messagesContainer.appendChild(typingDiv);

  const chatContainer = document.getElementById('chat-log');
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  return id;
}

/**
 * Removes the typing indicator from the chat.
 * @param {string} id - ID of the typing indicator element
 */
function removeTypingIndicator(id) {
  const element = document.getElementById(id);
  if (element) {
    element.remove();
  }
}
