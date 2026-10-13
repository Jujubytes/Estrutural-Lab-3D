// =============================================================================
// src/analysis/internalForces.js — Recuperação de Esforços Internos (N, V, M, T)
// Estrutural Lab 3D
// =============================================================================

import { multiplyVec } from '../utils/math.js';
import { computeEquivalentNodalLoads } from '../loads/loadCases.js';

/**
 * Calcula os esforços internos ao longo de cada elemento de barra.
 */
export function computeElementInternalForces(model, U_global, dofMap, elementAssemblyData, numPoints = 21) {
  const elementForcesMap = new Map();
  const dimension = model.dimension;

  for (const element of model.getElements()) {
    const data = elementAssemblyData.get(element.id);
    if (!data) continue;

    const { kLocal, T, L } = data;
    const dofs1 = dofMap.get(element.n1);
    const dofs2 = dofMap.get(element.n2);
    const elemDofs = [...dofs1, ...dofs2];

    // Vetor de deslocamentos globais do elemento
    const uGlobalElem = new Float64Array(elemDofs.length);
    for (let i = 0; i < elemDofs.length; i++) {
      uGlobalElem[i] = U_global[elemDofs[i]];
    }

    // Deslocamentos locais: u_local = T * u_global
    const uLocalElem = multiplyVec(T, uGlobalElem);

    // Forças de extremidade locais devido às deformações: f_deform = kLocal * u_local
    const fLocal = multiplyVec(kLocal, uLocalElem);

    // Identifica se há carga distribuída aplicada diretamente neste elemento
    let distLoad = null;
    for (const load of model.getLoads()) {
      if (load.type === 'distributed' && load.elementId === element.id) {
        distLoad = load;
        break;
      }
    }

    // Ações de engastamento perfeito locais (se houver carga distribuída)
    let fFixedLocal = null;
    if (distLoad) {
      // f_fixed é subtraído da ação nodal
      fFixedLocal = computeEquivalentNodalLoads(distLoad, L, dimension);
    }

    // Arrays de amostragem ao longo do comprimento x da barra
    const xArr = [];
    const nArr = [];
    const vyArr = [];
    const vzArr = [];
    const tArr = [];
    const myArr = [];
    const mzArr = [];

    const dx = L / (numPoints - 1);

    if (dimension === '2D') {
      // fLocal = [N1, V1, M1, N2, V2, M2]
      // Convenção de sinais de engenharia estrutural:
      // Normal: Tração positiva
      // Cortante: V1 para cima, V2 para baixo
      // Momento fletor: M1 no sentido anti-horário
      const N1 = fLocal[0];
      const V1 = fLocal[1];
      const M1 = fLocal[2];

      const q0 = distLoad && distLoad.direction === 'y' ? distLoad.q0 : 0;
      const q1 = distLoad && distLoad.direction === 'y' ? distLoad.q1 : 0;

      for (let i = 0; i < numPoints; i++) {
        const x = i * dx;
        xArr.push(x);

        // Esforço Normal N(x)
        const N_x = -N1;
        nArr.push(N_x);

        // Esforço Cortante V(x) = V1 - integral(q(t) dt)
        // q(t) = q0 + (q1 - q0) * (t / L)
        const intQ = (q0 * x) + (0.5 * (q1 - q0) * (x * x / L));
        // Se a carga transversal q for negativa (para baixo), subtrair intQ adiciona força:
        const V_x = V1 + intQ;
        vyArr.push(V_x);
        vzArr.push(0);

        // Momento Fletor M(x) = -M1 + V1*x + integral(q(t)*(x-t) dt)
        const intQMoment = (0.5 * q0 * x * x) + ((q1 - q0) * Math.pow(x, 3) / (6 * L));
        const M_x = -M1 + (V1 * x) + intQMoment;
        mzArr.push(M_x);
        myArr.push(0);
        tArr.push(0);
      }
    } else {
      // 3D: [u1, v1, w1, rx1, ry1, rz1, u2, v2, w2, rx2, ry2, rz2]
      const N1 = fLocal[0];
      const V1y = fLocal[1];
      const V1z = fLocal[2];
      const T1 = fLocal[3];
      const M1y = fLocal[4];
      const M1z = fLocal[5];

      const qY0 = distLoad && distLoad.direction === 'y' ? distLoad.q0 : 0;
      const qY1 = distLoad && distLoad.direction === 'y' ? distLoad.q1 : 0;

      for (let i = 0; i < numPoints; i++) {
        const x = i * dx;
        xArr.push(x);

        nArr.push(-N1);
        tArr.push(-T1);

        const intQY = (qY0 * x) + (0.5 * (qY1 - qY0) * (x * x / L));
        vyArr.push(V1y + intQY);
        vzArr.push(V1z);

        const intQMomentY = (0.5 * qY0 * x * x) + ((qY1 - qY0) * Math.pow(x, 3) / (6 * L));
        mzArr.push(-M1z + (V1y * x) + intQMomentY);
        myArr.push(-M1y + (V1z * x));
      }
    }

    // Calcula extremos (máximos e mínimos)
    const maxN = Math.max(...nArr), minN = Math.min(...nArr);
    const maxV = Math.max(...vyArr), minV = Math.min(...vyArr);
    const maxM = Math.max(...mzArr), minM = Math.min(...mzArr);

    elementForcesMap.set(element.id, {
      x: xArr,
      N: nArr,
      Vy: vyArr,
      Vz: vzArr,
      T: tArr,
      My: myArr,
      Mz: mzArr,
      maxN, minN,
      maxV, minV,
      maxM, minM
    });
  }

  return elementForcesMap;
}
