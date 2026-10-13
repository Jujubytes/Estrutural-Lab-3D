// =============================================================================
// src/model/supports.js — Condições de Apoio e Vínculos Estruturais
// Estrutural Lab 3D
// =============================================================================

export class Support {
  constructor(nodeId, { ux = false, uy = false, uz = false, rx = false, ry = false, rz = false } = {}) {
    this.nodeId = String(nodeId);
    this.ux = Boolean(ux);
    this.uy = Boolean(uy);
    this.uz = Boolean(uz);
    this.rx = Boolean(rx);
    this.ry = Boolean(ry);
    this.rz = Boolean(rz);
  }

  /**
   * Retorna os graus de liberdade restritos como array de booleanos.
   * Modo 2D: [ux, uy, rz]
   * Modo 3D: [ux, uy, uz, rx, ry, rz]
   */
  getRestraints(dimension = '2D') {
    if (dimension === '2D') {
      return [this.ux, this.uy, this.rz];
    }
    return [this.ux, this.uy, this.uz, this.rx, this.ry, this.rz];
  }

  /**
   * Classifica o apoio para renderização 3D.
   * Retorna: 'pinned' | 'roller' | 'fixed' | 'custom'
   */
  getType() {
    if (this.ux && this.uy && (this.rz || this.rx || this.ry)) return 'fixed';
    if (this.ux && this.uy && !this.rz && !this.rx && !this.ry) return 'pinned';
    if (!this.ux && this.uy && !this.rz && !this.rx && !this.ry) return 'roller';
    return 'custom';
  }

  toJSON() {
    return {
      nodeId: this.nodeId,
      ux: this.ux,
      uy: this.uy,
      uz: this.uz,
      rx: this.rx,
      ry: this.ry,
      rz: this.rz
    };
  }

  static fromJSON(data) {
    return new Support(data.nodeId, data);
  }
}

/**
 * Cria apoio com base em preset ('pinned' | 'roller' | 'fixed' | 'custom')
 */
export function createSupportPreset(nodeId, preset, dimension = '2D') {
  if (preset === 'pinned') {
    return new Support(nodeId, { ux: true, uy: true, uz: false, rx: false, ry: false, rz: false });
  }
  if (preset === 'roller') {
    return new Support(nodeId, { ux: false, uy: true, uz: false, rx: false, ry: false, rz: false });
  }
  if (preset === 'fixed') {
    if (dimension === '2D') {
      return new Support(nodeId, { ux: true, uy: true, uz: false, rx: false, ry: false, rz: true });
    }
    return new Support(nodeId, { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true });
  }
  return new Support(nodeId, {});
}
