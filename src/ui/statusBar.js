// =============================================================================
// src/ui/statusBar.js — Barra de Status Inferior e Indicadores em Tempo Real
// Estrutural Lab 3D
// =============================================================================

import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/events.js';

export function setupStatusBar() {
  const statusDim = document.getElementById('status-dimension');
  const statusNodes = document.getElementById('status-nodes-count');
  const statusElems = document.getElementById('status-elements-count');
  const statusSups = document.getElementById('status-supports-count');
  const statusLoads = document.getElementById('status-loads-count');
  const statusAnalysis = document.getElementById('status-analysis-state');
  const statusDot = document.getElementById('status-analysis-dot');

  function updateStatus() {
    const model = appState.model;
    if (statusDim) statusDim.textContent = model.dimension;
    if (statusNodes) statusNodes.textContent = model.getNodes().length;
    if (statusElems) statusElems.textContent = model.getElements().length;
    if (statusSups) statusSups.textContent = Object.keys(model.getSupports()).length;
    if (statusLoads) statusLoads.textContent = model.getLoads().length;

    if (appState.resultsManager.hasResult()) {
      if (appState.resultsManager.isStale) {
        if (statusAnalysis) statusAnalysis.textContent = 'Resultados Pendentes (Modelo Alterado)';
        if (statusDot) {
          statusDot.className = 'status-dot';
          statusDot.style.backgroundColor = '#fbbf24';
        }
      } else {
        if (statusAnalysis) statusAnalysis.textContent = 'Análise MEF Atualizada';
        if (statusDot) {
          statusDot.className = 'status-dot active';
          statusDot.style.backgroundColor = '#10b981';
        }
      }
    } else {
      if (statusAnalysis) statusAnalysis.textContent = 'Aguardando Análise';
      if (statusDot) {
        statusDot.className = 'status-dot';
        statusDot.style.backgroundColor = '#64748b';
      }
    }
  }

  eventBus.on(EVENTS.MODEL_CHANGED, updateStatus);
  eventBus.on(EVENTS.ANALYSIS_COMPLETED, updateStatus);
  eventBus.on(EVENTS.ANALYSIS_CLEARED, updateStatus);

  updateStatus();
}
