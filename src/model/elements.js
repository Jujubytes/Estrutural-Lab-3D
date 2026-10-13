// =============================================================================
// src/model/elements.js — Entidade de Elementos de Barra (Viga / Pilar)
// Estrutural Lab 3D
// =============================================================================

import { validateElementInputs } from '../utils/validation.js';
import { vecNormalize, vecCross, vecLength } from '../utils/math.js';

export class Element {
  constructor(id, n1, n2, materialId, sectionId) {
    validateElementInputs(id, n1, n2, materialId, sectionId);
    this.id = String(id);
    this.n1 = String(n1);
    this.n2 = String(n2);
    this.materialId = String(materialId);
    this.sectionId = String(sectionId);
  }

  /**
   * Calcula o comprimento do elemento com base nos nós fornecidos.
   */
  getLength(node1, node2) {
    return node1.distanceTo(node2);
  }

  /**
   * Calcula o vetor unitário diretor do elemento (eixo x local).
   */
  getDirectionVector(node1, node2) {
    const dx = node2.x - node1.x;
    const dy = node2.y - node1.y;
    const dz = node2.z - node1.z;
    return vecNormalize([dx, dy, dz]);
  }

  /**
   * Monta o sistema de coordenadas locais (xLocal, yLocal, zLocal) no espaço 3D.
   * xLocal: ao longo da barra de n1 para n2
   * yLocal: perpendicular no plano principal (ou vertical de referência)
   * zLocal: perpendicular pelo produto vetorial xLocal x yLocal
   */
  getLocalAxes(node1, node2) {
    const L = this.getLength(node1, node2);
    if (L < 1e-9) {
      return {
        xLocal: [1, 0, 0],
        yLocal: [0, 1, 0],
        zLocal: [0, 0, 1]
      };
    }

    const dx = (node2.x - node1.x) / L;
    const dy = (node2.y - node1.y) / L;
    const dz = (node2.z - node1.z) / L;
    const xLocal = [dx, dy, dz];

    // Se o elemento for quase vertical (ao longo do eixo Y global)
    let yLocal;
    if (Math.abs(dx) < 1e-4 && Math.abs(dz) < 1e-4) {
      // Elemento vertical: vetor de referência ao longo de Z ou X
      const sign = dy >= 0 ? 1 : -1;
      yLocal = [0, 0, sign];
    } else {
      // Elemento geral: vetor auxiliar Y global [0, 1, 0]
      const up = [0, 1, 0];
      const zTemp = vecNormalize(vecCross(xLocal, up));
      yLocal = vecNormalize(vecCross(zTemp, xLocal));
    }

    const zLocal = vecNormalize(vecCross(xLocal, yLocal));

    return { xLocal, yLocal, zLocal };
  }

  toJSON() {
    return {
      id: this.id,
      n1: this.n1,
      n2: this.n2,
      materialId: this.materialId,
      sectionId: this.sectionId
    };
  }

  static fromJSON(data) {
    return new Element(data.id, data.n1, data.n2, data.materialId, data.sectionId);
  }
}
