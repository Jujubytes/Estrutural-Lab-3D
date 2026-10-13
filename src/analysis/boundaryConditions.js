// =============================================================================
// src/analysis/boundaryConditions.js — Aplicação das Condições de Contorno (Apoios)
// Estrutural Lab 3D
// =============================================================================

import { createMatrix } from '../utils/math.js';

/**
 * Identifica os graus de liberdade livres e restritos e particiona o sistema global.
 */
export function applyBoundaryConditions(model, K, F, dofMap, totalDofs) {
  const supports = model.getSupports();
  const restrainedDofsSet = new Set();

  for (const [nodeId, sup] of Object.entries(supports)) {
    const dofs = dofMap.get(nodeId);
    if (!dofs) continue;

    const restraints = sup.getRestraints(model.dimension);
    restraints.forEach((isRestrained, idx) => {
      if (isRestrained && idx < dofs.length) {
        restrainedDofsSet.add(dofs[idx]);
      }
    });
  }

  const freeDofs = [];
  const restrainedDofs = [];

  for (let i = 0; i < totalDofs; i++) {
    if (restrainedDofsSet.has(i)) {
      restrainedDofs.push(i);
    } else {
      freeDofs.push(i);
    }
  }

  const nFree = freeDofs.length;
  const nRest = restrainedDofs.length;

  // Submatriz K_ff e vetor F_f
  const K_ff = createMatrix(nFree, nFree, 0);
  const F_f = new Float64Array(nFree);

  for (let i = 0; i < nFree; i++) {
    const origI = freeDofs[i];
    F_f[i] = F[origI];
    for (let j = 0; j < nFree; j++) {
      const origJ = freeDofs[j];
      K_ff[i][j] = K[origI][origJ];
    }
  }

  // Submatriz K_rf para cálculo de reações de apoio: R = K_rf * U_f - F_r
  const K_rf = createMatrix(nRest, nFree, 0);
  const F_r = new Float64Array(nRest);

  for (let i = 0; i < nRest; i++) {
    const origI = restrainedDofs[i];
    F_r[i] = F[origI];
    for (let j = 0; j < nFree; j++) {
      const origJ = freeDofs[j];
      K_rf[i][j] = K[origI][origJ];
    }
  }

  return {
    K_ff,
    F_f,
    K_rf,
    F_r,
    freeDofs,
    restrainedDofs
  };
}
