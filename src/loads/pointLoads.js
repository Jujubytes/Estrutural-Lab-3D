// =============================================================================
// src/loads/pointLoads.js — Cargas Concentradas Nodais (Forças e Momentos)
// Estrutural Lab 3D
// =============================================================================

export class PointLoad {
  constructor(id, nodeId, { fx = 0, fy = 0, fz = 0, mx = 0, my = 0, mz = 0 } = {}) {
    this.id = String(id);
    this.nodeId = String(nodeId);
    this.fx = Number(fx) || 0; // kN
    this.fy = Number(fy) || 0; // kN
    this.fz = Number(fz) || 0; // kN
    this.mx = Number(mx) || 0; // kNm
    this.my = Number(my) || 0; // kNm
    this.mz = Number(mz) || 0; // kNm
    this.type = 'point';
  }

  getMagnitude() {
    return Math.sqrt(this.fx * this.fx + this.fy * this.fy + this.fz * this.fz);
  }

  getMomentMagnitude() {
    return Math.sqrt(this.mx * this.mx + this.my * this.my + this.mz * this.mz);
  }

  toJSON() {
    return {
      id: this.id,
      nodeId: this.nodeId,
      fx: this.fx,
      fy: this.fy,
      fz: this.fz,
      mx: this.mx,
      my: this.my,
      mz: this.mz,
      type: this.type
    };
  }

  static fromJSON(data) {
    return new PointLoad(data.id, data.nodeId, data);
  }
}
