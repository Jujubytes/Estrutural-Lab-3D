// =============================================================================
// src/analysis/reactions.js — Recuperação de Reações de Apoio e Equilíbrio Estático
// Estrutural Lab 3D
// =============================================================================

import { multiplyVec } from '../utils/math.js';

/**
 * Calcula as reações de apoio nos nós vinculados: R = K_rf * U_f - F_r
 */
export function computeReactions(K_rf, F_r, U_f, restrainedDofs, dofMap, model) {
  const reactionsMap = new Map();
  const dimension = model.dimension;

  let R_values;
  if (restrainedDofs.length > 0 && U_f.length > 0) {
    const Ku = multiplyVec(K_rf, U_f);
    R_values = new Float64Array(restrainedDofs.length);
    for (let i = 0; i < restrainedDofs.length; i++) {
      R_values[i] = Ku[i] - F_r[i];
    }
  } else if (restrainedDofs.length > 0) {
    R_values = new Float64Array(restrainedDofs.length);
    for (let i = 0; i < restrainedDofs.length; i++) {
      R_values[i] = -F_r[i];
    }
  } else {
    R_values = new Float64Array(0);
  }

  // Mapa de DOF global para reação calculada
  const globalReactionMap = new Map();
  for (let i = 0; i < restrainedDofs.length; i++) {
    globalReactionMap.set(restrainedDofs[i], R_values[i]);
  }

  // Organiza reações por nó com apoio
  const supports = model.getSupports();
  for (const nodeId of Object.keys(supports)) {
    const dofs = dofMap.get(nodeId);
    if (!dofs) continue;

    let fx = 0, fy = 0, fz = 0, mx = 0, my = 0, mz = 0;

    if (dimension === '2D') {
      fx = globalReactionMap.get(dofs[0]) || 0;
      fy = globalReactionMap.get(dofs[1]) || 0;
      mz = globalReactionMap.get(dofs[2]) || 0;
    } else {
      fx = globalReactionMap.get(dofs[0]) || 0;
      fy = globalReactionMap.get(dofs[1]) || 0;
      fz = globalReactionMap.get(dofs[2]) || 0;
      mx = globalReactionMap.get(dofs[3]) || 0;
      my = globalReactionMap.get(dofs[4]) || 0;
      mz = globalReactionMap.get(dofs[5]) || 0;
    }

    reactionsMap.set(nodeId, { fx, fy, fz, mx, my, mz });
  }

  return reactionsMap;
}

/**
 * Calcula a verificação de equilíbrio estático global entre cargas externas e reações.
 */
export function checkGlobalEquilibrium(model, reactionsMap) {
  let sumFxExt = 0, sumFyExt = 0, sumFzExt = 0;
  let sumRx = 0, sumRy = 0, sumRz = 0;

  // Soma de forças externas
  for (const load of model.getLoads()) {
    if (load.type === 'distributed') {
      const el = model.getElement(load.elementId);
      if (el) {
        const n1 = model.getNode(el.n1);
        const n2 = model.getNode(el.n2);
        if (n1 && n2) {
          const L = n1.distanceTo(n2);
          const totalQ = ((load.q0 + load.q1) / 2) * L;
          if (load.direction === 'y') sumFyExt += totalQ;
          else if (load.direction === 'x') sumFxExt += totalQ;
          else if (load.direction === 'z') sumFzExt += totalQ;
        }
      }
    } else {
      sumFxExt += load.fx;
      sumFyExt += load.fy;
      sumFzExt += load.fz;
    }
  }

  // Soma de reações
  for (const r of reactionsMap.values()) {
    sumRx += r.fx;
    sumRy += r.fy;
    sumRz += r.fz;
  }

  const diffX = sumFxExt + sumRx;
  const diffY = sumFyExt + sumRy;
  const diffZ = sumFzExt + sumRz;

  const isEquilibrium = Math.abs(diffX) < 0.05 && Math.abs(diffY) < 0.05 && Math.abs(diffZ) < 0.05;

  return {
    sumFxExt, sumFyExt, sumFzExt,
    sumRx, sumRy, sumRz,
    diffX, diffY, diffZ,
    isEquilibrium
  };
}
