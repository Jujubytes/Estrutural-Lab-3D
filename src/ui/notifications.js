// =============================================================================
// src/ui/notifications.js — Sistema Flutuante de Toasts e Avisos
// Estrutural Lab 3D
// =============================================================================

import { eventBus, EVENTS } from '../core/events.js';

export function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 0.2s, transform 0.2s';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, duration);
}

// Escuta eventos de toast do barramento central
eventBus.on(EVENTS.TOAST, ({ message, type, duration }) => {
  showToast(message, type, duration);
});
