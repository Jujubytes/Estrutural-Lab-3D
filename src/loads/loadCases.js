// =============================================================================
// src/loads/loadCases.js — Casos de Carregamento e Cargas Nodais Equivalentes
// Estrutural Lab 3D
// =============================================================================

/**
 * Calcula as ações de engastamento perfeito e o vetor de cargas nodais equivalentes
 * para uma carga distribuída ao longo de um elemento de barra de comprimento L.
 *
 * @param {DistributedLoad} distLoad Carga distribuída (uniforme ou trapezoidal)
 * @param {number} L Comprimento do elemento (m)
 * @param {string} dimension '2D' | '3D'
 * @returns {Float64Array} Vetor de forças nodais equivalentes no sistema local
 */
export function computeEquivalentNodalLoads(distLoad, L, dimension = '2D') {
  const q0 = distLoad.q0;
  const q1 = distLoad.q1;

  // Parcelas uniforme e triangular
  const qU = q0;
  const qT = q1 - q0;

  // Reações de engastamento perfeito para flexão (eixo transversal):
  // Parcela uniforme:
  // V1 = qU * L / 2, V2 = qU * L / 2
  // M1 = qU * L² / 12, M2 = -qU * L² / 12
  // Parcela triangular (0 em x=0, qT em x=L):
  // V1 = 3/20 * qT * L, V2 = 7/20 * qT * L
  // M1 = qT * L² / 30, M2 = -qT * L² / 20

  const v1 = (qU * L / 2) + (3 / 20 * qT * L);
  const v2 = (qU * L / 2) + (7 / 20 * qT * L);
  const m1 = (qU * L * L / 12) + (qT * L * L / 30);
  const m2 = (-qU * L * L / 12) - (qT * L * L / 20);

  if (dimension === '2D') {
    // DOF local 2D: [u1, v1, θz1, u2, v2, θz2]
    // A carga equivalente aplicada nos nós é a ação direta:
    const fEq = new Float64Array(6);
    if (distLoad.direction === 'x') {
      // Carga axial distribuída: divide meio a meio
      const axTotal = ((q0 + q1) / 2) * L;
      fEq[0] = axTotal / 2;
      fEq[3] = axTotal / 2;
    } else {
      // Carga transversal (eixo y)
      fEq[1] = v1;
      fEq[2] = m1;
      fEq[4] = v2;
      fEq[5] = m2;
    }
    return fEq;
  } else {
    // DOF local 3D: [u1, v1, w1, rx1, ry1, rz1, u2, v2, w2, rx2, ry2, rz2] (12 DOFs)
    const fEq = new Float64Array(12);
    if (distLoad.direction === 'x') {
      const axTotal = ((q0 + q1) / 2) * L;
      fEq[0] = axTotal / 2;
      fEq[6] = axTotal / 2;
    } else if (distLoad.direction === 'z') {
      // Flexão em torno do eixo Y local
      fEq[2] = v1;
      fEq[4] = -m1;
      fEq[8] = v2;
      fEq[10] = -m2;
    } else {
      // Transversal Y local (flexão em torno de Z)
      fEq[1] = v1;
      fEq[5] = m1;
      fEq[7] = v2;
      fEq[11] = m2;
    }
    return fEq;
  }
}
