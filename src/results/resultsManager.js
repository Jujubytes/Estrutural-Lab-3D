// =============================================================================
// src/results/resultsManager.js — Gerenciador de Resultados da Análise MEF
// Estrutural Lab 3D
// =============================================================================

export class ResultsManager {
  constructor() {
    this.currentResult = null;
    this.isStale = false;
  }

  setResult(result) {
    this.currentResult = result;
    this.isStale = false;
  }

  clear() {
    this.currentResult = null;
    this.isStale = false;
  }

  invalidate() {
    this.isStale = true;
  }

  hasResult() {
    return this.currentResult !== null && this.currentResult.success === true;
  }

  getResult() {
    return this.currentResult;
  }

  getDisplacement(nodeId) {
    if (!this.currentResult || !this.currentResult.displacements) return null;
    const d = this.currentResult.displacements;
    return d instanceof Map ? d.get(nodeId) : d[nodeId];
  }

  getReaction(nodeId) {
    if (!this.currentResult || !this.currentResult.reactions) return null;
    const r = this.currentResult.reactions;
    return r instanceof Map ? r.get(nodeId) : r[nodeId];
  }

  getElementForces(elementId) {
    if (!this.currentResult || !this.currentResult.elementForces) return null;
    const ef = this.currentResult.elementForces;
    return ef instanceof Map ? ef.get(elementId) : ef[elementId];
  }
}
