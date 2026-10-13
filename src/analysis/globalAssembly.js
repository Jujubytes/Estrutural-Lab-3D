// =============================================================================
// src/analysis/globalAssembly.js — Montagem da Rigidez Global e Vetor de Forças
// Estrutural Lab 3D
// =============================================================================

import { createMatrix, transpose, multiplyVec } from '../utils/math.js';
import { computeGlobalElementStiffness } from './elementMatrices.js';
import { computeEquivalentNodalLoads } from '../loads/loadCases.js';

/**
 * Cria o mapa de numeração de graus de liberdade para cada nó.
 * Em 2D: 3 DOFs por nó (ux, uy, rz).
 * Em 3D: 6 DOFs por nó (ux, uy, uz, rx, ry, rz).
 */
export function createDofMap(model) {
  const nodes = model.getNodes();
  const dofsPerNode = model.dimension === '2D' ? 3 : 6;
  const dofMap = new Map();

  nodes.forEach((node, index) => {
    const startDof = index * dofsPerNode;
    const dofs = [];
    for (let d = 0; d < dofsPerNode; d++) {
      dofs.push(startDof + d);
    }
    dofMap.set(node.id, dofs);
  });

  return {
    dofMap,
    dofsPerNode,
    totalDofs: nodes.length * dofsPerNode
  };
}

/**
 * Monta a matriz de rigidez global K e o vetor de cargas globais F.
 */
export function assembleGlobalSystem(model) {
  const { dofMap, dofsPerNode, totalDofs } = createDofMap(model);
  const K = createMatrix(totalDofs, totalDofs, 0);
  const F = new Float64Array(totalDofs);

  // Cache dos dados calculados dos elementos para reaproveitamento nos esforços internos
  const elementAssemblyData = new Map();

  // 1. Montagem da Matriz de Rigidez Global (K)
  const elements = model.getElements();
  for (const element of elements) {
    const { kLocal, kGlobal, T, L } = computeGlobalElementStiffness(model, element);
    elementAssemblyData.set(element.id, { kLocal, kGlobal, T, L });

    const dofs1 = dofMap.get(element.n1);
    const dofs2 = dofMap.get(element.n2);
    const elemDofs = [...dofs1, ...dofs2];

    const nDofElem = elemDofs.length;
    for (let i = 0; i < nDofElem; i++) {
      const globalI = elemDofs[i];
      for (let j = 0; j < nDofElem; j++) {
        const globalJ = elemDofs[j];
        K[globalI][globalJ] += kGlobal[i][j];
      }
    }
  }

  // 2. Montagem do Vetor de Forças Globais (F)
  const loads = model.getLoads();
  for (const load of loads) {
    if (load.type === 'point') {
      const dofs = dofMap.get(load.nodeId);
      if (!dofs) continue;

      if (model.dimension === '2D') {
        F[dofs[0]] += load.fx;
        F[dofs[1]] += load.fy;
        F[dofs[2]] += load.mz;
      } else {
        F[dofs[0]] += load.fx;
        F[dofs[1]] += load.fy;
        F[dofs[2]] += load.fz;
        F[dofs[3]] += load.mx;
        F[dofs[4]] += load.my;
        F[dofs[5]] += load.mz;
      }
    } else if (load.type === 'distributed') {
      const elemData = elementAssemblyData.get(load.elementId);
      if (!elemData) continue;

      const element = model.getElement(load.elementId);
      const dofs1 = dofMap.get(element.n1);
      const dofs2 = dofMap.get(element.n2);
      const elemDofs = [...dofs1, ...dofs2];

      // Vetor de cargas equivalentes no sistema local
      const fEqLocal = computeEquivalentNodalLoads(load, elemData.L, model.dimension);

      // Converte para o sistema global: F_eq_global = T^T * f_eq_local
      const T_trans = transpose(elemData.T);
      const fEqGlobal = multiplyVec(T_trans, fEqLocal);

      for (let i = 0; i < elemDofs.length; i++) {
        const globalI = elemDofs[i];
        F[globalI] += fEqGlobal[i];
      }
    }
  }

  return {
    K,
    F,
    dofMap,
    dofsPerNode,
    totalDofs,
    elementAssemblyData
  };
}
