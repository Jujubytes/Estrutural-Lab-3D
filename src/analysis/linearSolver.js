// =============================================================================
// src/analysis/linearSolver.js — Solucionador do Sistema e Mapeamento de Deslocamentos
// Estrutural Lab 3D
// =============================================================================

import { solveLinearSystem } from '../utils/math.js';

/**
 * Resolve o sistema reduzido K_ff * U_f = F_f e reconstrói o vetor global de deslocamentos.
 */
export function solveDisplacements(K_ff, F_f, freeDofs, totalDofs, dofMap, dimension = '2D') {
  // Se todos os DOFs forem restritos (ex: estrutura engastada sem DOFs livres)
  let U_f;
  if (freeDofs.length > 0) {
    U_f = solveLinearSystem(K_ff, F_f);
  } else {
    U_f = new Float64Array(0);
  }

  // Reconstrói o vetor completo de deslocamentos U_global
  const U_global = new Float64Array(totalDofs);
  for (let i = 0; i < freeDofs.length; i++) {
    U_global[freeDofs[i]] = U_f[i];
  }

  // Mapeia deslocamentos por nó
  const displacements = new Map();
  let maxDisplacement = 0;

  for (const [nodeId, dofs] of dofMap.entries()) {
    let ux = 0, uy = 0, uz = 0, rx = 0, ry = 0, rz = 0;

    if (dimension === '2D') {
      ux = U_global[dofs[0]];
      uy = U_global[dofs[1]];
      rz = U_global[dofs[2]];
    } else {
      ux = U_global[dofs[0]];
      uy = U_global[dofs[1]];
      uz = U_global[dofs[2]];
      rx = U_global[dofs[3]];
      ry = U_global[dofs[4]];
      rz = U_global[dofs[5]];
    }

    const transMag = Math.sqrt(ux * ux + uy * uy + uz * uz);
    if (transMag > maxDisplacement) maxDisplacement = transMag;

    displacements.set(nodeId, { ux, uy, uz, rx, ry, rz });
  }

  return {
    U_f,
    U_global,
    displacements,
    maxDisplacement
  };
}
