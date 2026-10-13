// =============================================================================
// src/core/events.js — Barramento de Eventos Desacoplado (EventBus)
// Estrutural Lab 3D
// =============================================================================

export const EVENTS = {
  MODEL_CHANGED: 'model:changed',
  SELECTION_CHANGED: 'selection:changed',
  ANALYSIS_STARTED: 'analysis:started',
  ANALYSIS_COMPLETED: 'analysis:completed',
  ANALYSIS_CLEARED: 'analysis:cleared',
  VIEW_OPTIONS_CHANGED: 'view:options_changed',
  CAMERA_ACTION: 'camera:action',
  TOAST: 'ui:toast'
};

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => this.off(eventName, callback);
  }

  off(eventName, callback) {
    if (this.listeners.has(eventName)) {
      this.listeners.get(eventName).delete(callback);
    }
  }

  emit(eventName, data = null) {
    if (this.listeners.has(eventName)) {
      for (const callback of this.listeners.get(eventName)) {
        try {
          callback(data);
        } catch (e) {
          console.error(`Erro ao disparar evento ${eventName}:`, e);
        }
      }
    }
  }
}

export const eventBus = new EventBus();
