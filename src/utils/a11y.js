/**
 * Accessibility utilities
 */

/**
 * Announce messages to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management
 */
export const setFocus = (element) => {
  if (element) {
    element.focus();
    // Announce focus change
    announceToScreenReader(`Focused on ${element.getAttribute('aria-label') || element.textContent}`);
  }
};

/**
 * Keyboard event handler
 */
export const handleKeyboardEvent = (event, callbacks) => {
  const { Enter, Escape, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space } = callbacks;
  
  switch (event.key) {
    case 'Enter':
      Enter?.(event);
      break;
    case 'Escape':
      Escape?.(event);
      break;
    case 'ArrowUp':
      ArrowUp?.(event);
      break;
    case 'ArrowDown':
      ArrowDown?.(event);
      break;
    case 'ArrowLeft':
      ArrowLeft?.(event);
      break;
    case 'ArrowRight':
      ArrowRight?.(event);
      break;
    case ' ':
      Space?.(event);
      break;
    default:
      break;
  }
};

/**
 * Check if element is visible
 */
export const isElementVisible = (element) => {
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
};

/**
 * Get all focusable elements
 */
export const getFocusableElements = (container = document) => {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  
  return Array.from(container.querySelectorAll(focusableSelectors));
};

/**
 * Trap focus within a modal
 */
export const trapFocus = (event, container) => {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  if (event.key === 'Tab') {
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
};

/**
 * Create accessible modal
 */
export const createAccessibleModal = (modalElement, triggerElement) => {
  const closeButton = modalElement.querySelector('[aria-label="Close"]');
  
  const openModal = () => {
    modalElement.setAttribute('aria-hidden', 'false');
    modalElement.style.display = 'block';
    setFocus(closeButton || modalElement);
  };
  
  const closeModal = () => {
    modalElement.setAttribute('aria-hidden', 'true');
    modalElement.style.display = 'none';
    setFocus(triggerElement);
  };
  
  closeButton?.addEventListener('click', closeModal);
  modalElement.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    trapFocus(e, modalElement);
  });
  
  return { openModal, closeModal };
};
