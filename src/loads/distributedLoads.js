// =============================================================================
// src/loads/distributedLoads.js — Cargas Distribuídas Lineares em Barras
// Estrutural Lab 3D
// =============================================================================

export class DistributedLoad {
  constructor(id, elementId, { direction = 'y', q0 = 0, q1 = null, coordSystem = 'global' } = {}) {
    this.id = String(id);
    this.elementId = String(elementId);
    this.direction = String(direction).toLowerCase(); // 'x', 'y', 'z'
    this.q0 = Number(q0) || 0; // kN/m
    this.q1 = q1 !== null ? Number(q1) : this.q0; // kN/m (suporte a carga trapezoidal)
    this.coordSystem = String(coordSystem).toLowerCase(); // 'global' ou 'local'
    this.type = 'distributed';
  }

  isUniform() {
    return Math.abs(this.q0 - this.q1) < 1e-9;
  }

  toJSON() {
    return {
      id: this.id,
      elementId: this.elementId,
      direction: this.direction,
      q0: this.q0,
      q1: this.q1,
      coordSystem: this.coordSystem,
      type: this.type
    };
  }

  static fromJSON(data) {
    return new DistributedLoad(data.id, data.elementId, data);
  }
}
