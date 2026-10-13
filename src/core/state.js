// =============================================================================
// src/core/state.js — Gerenciador de Estado Compartilhado da Aplicação
// Estrutural Lab 3D
// =============================================================================

import { eventBus, EVENTS } from './events.js';
import { ResultsManager } from '../results/resultsManager.js';
import { StructuralModel } from '../model/structuralModel.js';

export class AppState {
  constructor() {
    this.model = StructuralModel.createSimplySupportedBeam(8, 100);
    this.resultsManager = new ResultsManager();

    this.selectedNodeId = null;
    this.selectedElementId = null;

    this.activeDiagram = 'none'; // 'none' | 'N' | 'V' | 'M'
    this.showDeformed = false;
    this.deformScale = 100;

    this.visibility = {
      nodes: true,
      labels: true,
      supports: true,
      loads: true,
      grid: true,
      axes: true,
      ghost: true
    };
  }

  setModel(newModel) {
    this.model = newModel;
    this.selectedNodeId = null;
    this.selectedElementId = null;
    this.resultsManager.clear();
    eventBus.emit(EVENTS.MODEL_CHANGED, this.model);
    eventBus.emit(EVENTS.SELECTION_CHANGED, { nodeId: null, elementId: null });
    eventBus.emit(EVENTS.ANALYSIS_CLEARED);
  }

  notifyModelChanged() {
    this.resultsManager.invalidate();
    eventBus.emit(EVENTS.MODEL_CHANGED, this.model);
  }

  setAnalysisResult(result) {
    this.resultsManager.setResult(result);
    if (result && result.success) {
      this.showDeformed = true;

      // Cálculo de escala visual proporcional e perceptível automaticamente
      if (result.maxDisplacement > 1e-9) {
        const nodes = this.model.getNodes();
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        nodes.forEach(n => {
          if (n.x < minX) minX = n.x;
          if (n.x > maxX) maxX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.y > maxY) maxY = n.y;
        });
        const maxSpan = Math.max(maxX - minX, maxY - minY, 4);
        const targetVisual = maxSpan * 0.08; // ~8% da dimensão da estrutura
        let calcScale = Math.round(targetVisual / result.maxDisplacement);
        if (calcScale > 50) calcScale = Math.round(calcScale / 10) * 10;
        this.deformScale = Math.max(1, Math.min(10000, calcScale));
      }
    }
    eventBus.emit(EVENTS.ANALYSIS_COMPLETED, result);
    eventBus.emit(EVENTS.VIEW_OPTIONS_CHANGED);
  }

  clearAnalysisResult() {
    this.resultsManager.clear();
    this.showDeformed = false;
    this.activeDiagram = 'none';
    eventBus.emit(EVENTS.ANALYSIS_CLEARED);
    eventBus.emit(EVENTS.VIEW_OPTIONS_CHANGED);
  }

  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.selectedElementId = null;
    eventBus.emit(EVENTS.SELECTION_CHANGED, {
      nodeId: this.selectedNodeId,
      elementId: null
    });
  }

  selectElement(elementId) {
    this.selectedElementId = elementId;
    this.selectedNodeId = null;
    eventBus.emit(EVENTS.SELECTION_CHANGED, {
      nodeId: null,
      elementId: this.selectedElementId
    });
  }

  clearSelection() {
    this.selectedNodeId = null;
    this.selectedElementId = null;
    eventBus.emit(EVENTS.SELECTION_CHANGED, {
      nodeId: null,
      elementId: null
    });
  }

  setActiveDiagram(type) {
    this.activeDiagram = type;
    eventBus.emit(EVENTS.VIEW_OPTIONS_CHANGED);
  }

  setShowDeformed(show) {
    this.showDeformed = Boolean(show);
    eventBus.emit(EVENTS.VIEW_OPTIONS_CHANGED);
  }

  setDeformScale(scale) {
    this.deformScale = Number(scale);
    eventBus.emit(EVENTS.VIEW_OPTIONS_CHANGED);
  }

  setVisibility(key, value) {
    this.visibility[key] = Boolean(value);
    eventBus.emit(EVENTS.VIEW_OPTIONS_CHANGED);
  }
}

export const appState = new AppState();
