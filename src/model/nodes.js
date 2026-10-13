// =============================================================================
// src/model/nodes.js — Entidade de Nós Estruturais
// Estrutural Lab 3D
// =============================================================================

import { validateNodeInputs } from '../utils/validation.js';

export class Node {
  constructor(id, x, y, z = 0) {
    validateNodeInputs(id, x, y, z);
    this.id = String(id);
    this.x = Number(x);
    this.y = Number(y);
    this.z = Number(z);
  }

  /**
   * Distância euclidiana até outro nó.
   */
  distanceTo(otherNode) {
    const dx = otherNode.x - this.x;
    const dy = otherNode.y - this.y;
    const dz = otherNode.z - this.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Retorna array com coordenadas [x, y, z].
   */
  toArray() {
    return [this.x, this.y, this.z];
  }

  toJSON() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      z: this.z
    };
  }

  static fromJSON(data) {
    return new Node(data.id, data.x, data.y, data.z);
  }
}
