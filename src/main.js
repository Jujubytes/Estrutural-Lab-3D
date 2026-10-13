// =============================================================================
// src/main.js — Ponto de Entrada da Aplicação Estrutural Lab 3D
// =============================================================================

import { App } from './core/app.js';

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.__STRUCTURAL_APP__ = app;
});
