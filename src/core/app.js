// =============================================================================
// src/core/app.js — Orquestrador do Ciclo de Vida da Aplicação
// Estrutural Lab 3D
// =============================================================================

import { appState } from './state.js';
import { StructuralRenderer } from '../visualization/renderer.js';
import { setupToolbar } from '../ui/toolbar.js';
import { setupModelPanel } from '../ui/modelPanel.js';
import { setupLoadPanel } from '../ui/loadPanel.js';
import { setupMaterialPanel } from '../ui/materialPanel.js';
import { setupResultsPanel } from '../ui/resultsPanel.js';
import { setupViewportOverlay } from '../ui/viewportOverlay.js';
import { setupTestModal } from '../ui/testModal.js';
import { setupStatusBar } from '../ui/statusBar.js';
import { analyzeStructure } from '../analysis/analysisManager.js';

export class App {
  constructor() {
    this.renderer = null;
  }

  init() {
    // 1. Inicializa o Viewport 3D Three.js
    const canvas = document.getElementById('canvas3d');
    const container = document.getElementById('viewport-container');

    if (canvas && container) {
      this.renderer = new StructuralRenderer(canvas, container);
    } else {
      console.error('Canvas 3D ou container não encontrados no DOM.');
    }

    // 2. Inicializa os Controladores da Interface (UI)
    setupToolbar();
    setupModelPanel();
    setupLoadPanel();
    setupMaterialPanel();
    setupResultsPanel();
    setupViewportOverlay();
    setupTestModal();
    setupStatusBar();

    // 3. Executa a primeira análise estrutural automática no modelo padrão
    setTimeout(() => {
      const initialResult = analyzeStructure(appState.model);
      if (initialResult.success) {
        appState.setAnalysisResult(initialResult);
      }
    }, 100);
  }
}
