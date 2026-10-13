// =============================================================================
// src/analysis/elementMatrices.js — Matrizes de Rigidez de Elementos (2D e 3D)
// Estrutural Lab 3D
// =============================================================================

import { createMatrix, multiply, transpose } from '../utils/math.js';
import { buildTransformMatrix2D, buildTransformMatrix3D } from './coordinateTransform.js';

/**
 * Monta a matriz de rigidez local 2D (6 x 6) de um elemento de pórtico plano.
 * DOFs: [u1, v1, θz1, u2, v2, θz2]
 */
export function buildElementStiffnessMatrix2D(E, A, Iz, L) {
  const k = createMatrix(6, 6, 0);

  const ea_L = (E * A) / L;
  const eIz_L3_12 = (12 * E * Iz) / Math.pow(L, 3);
  const eIz_L2_6 = (6 * E * Iz) / Math.pow(L, 2);
  const eIz_L_4 = (4 * E * Iz) / L;
  const eIz_L_2 = (2 * E * Iz) / L;

  // Rigidez Axial
  k[0][0] = ea_L;   k[0][3] = -ea_L;
  k[3][0] = -ea_L;  k[3][3] = ea_L;

  // Rigidez à Flexão e Cortante
  k[1][1] = eIz_L3_12;   k[1][2] = eIz_L2_6;    k[1][4] = -eIz_L3_12;  k[1][5] = eIz_L2_6;
  k[2][1] = eIz_L2_6;    k[2][2] = eIz_L_4;     k[2][4] = -eIz_L2_6;   k[2][5] = eIz_L_2;

  k[4][1] = -eIz_L3_12;  k[4][2] = -eIz_L2_6;   k[4][4] = eIz_L3_12;   k[4][5] = -eIz_L2_6;
  k[5][1] = eIz_L2_6;    k[5][2] = eIz_L_2;     k[5][4] = -eIz_L2_6;   k[5][5] = eIz_L_4;

  return k;
}

/**
 * Monta a matriz de rigidez local 3D (12 x 12) de um elemento de pórtico espacial.
 * DOFs: [u1, v1, w1, rx1, ry1, rz1, u2, v2, w2, rx2, ry2, rz2]
 */
export function buildElementStiffnessMatrix3D(E, G, A, Iz, Iy, J, L) {
  const k = createMatrix(12, 12, 0);

  const L2 = L * L;
  const L3 = L2 * L;

  // Axial
  const ea_L = (E * A) / L;
  k[0][0] = ea_L;   k[0][6] = -ea_L;
  k[6][0] = -ea_L;  k[6][6] = ea_L;

  // Torção
  const gj_L = (G * J) / L;
  k[3][3] = gj_L;   k[3][9] = -gj_L;
  k[9][3] = -gj_L;  k[9][9] = gj_L;

  // Flexão no plano XY (em torno do eixo Z com Iz)
  const eIz_12 = (12 * E * Iz) / L3;
  const eIz_6 = (6 * E * Iz) / L2;
  const eIz_4 = (4 * E * Iz) / L;
  const eIz_2 = (2 * E * Iz) / L;

  k[1][1] = eIz_12;   k[1][5] = eIz_6;    k[1][7] = -eIz_12;  k[1][11] = eIz_6;
  k[5][1] = eIz_6;    k[5][5] = eIz_4;    k[5][7] = -eIz_6;   k[5][11] = eIz_2;

  k[7][1] = -eIz_12;  k[7][5] = -eIz_6;   k[7][7] = eIz_12;   k[7][11] = -eIz_6;
  k[11][1] = eIz_6;   k[11][5] = eIz_2;   k[11][7] = -eIz_6;  k[11][11] = eIz_4;

  // Flexão no plano XZ (em torno do eixo Y com Iy)
  const eIy_12 = (12 * E * Iy) / L3;
  const eIy_6 = (6 * E * Iy) / L2;
  const eIy_4 = (4 * E * Iy) / L;
  const eIy_2 = (2 * E * Iy) / L;

  k[2][2] = eIy_12;   k[2][4] = -eIy_6;   k[2][8] = -eIy_12;  k[2][10] = -eIy_6;
  k[4][2] = -eIy_6;   k[4][4] = eIy_4;    k[4][8] = eIy_6;    k[4][10] = eIy_2;

  k[8][2] = -eIy_12;  k[8][4] = eIy_6;    k[8][8] = eIy_12;   k[8][10] = eIy_6;
  k[10][2] = -eIy_6;  k[10][4] = eIy_2;   k[10][8] = eIy_6;   k[10][10] = eIy_4;

  return k;
}

/**
 * Calcula a matriz de rigidez do elemento no sistema global: K_global = T^T * k_local * T
 */
export function computeGlobalElementStiffness(model, element) {
  const n1 = model.getNode(element.n1);
  const n2 = model.getNode(element.n2);
  const mat = model.getMaterial(element.materialId);
  const sec = model.getSection(element.sectionId);

  if (model.dimension === '2D') {
    const { T, L } = buildTransformMatrix2D(n1, n2);
    const kLocal = buildElementStiffnessMatrix2D(mat.E, sec.A, sec.Iz, L);
    const T_trans = transpose(T);
    const kGlobal = multiply(T_trans, multiply(kLocal, T));
    return { kLocal, kGlobal, T, L };
  } else {
    const { T, L } = buildTransformMatrix3D(n1, n2, element);
    const kLocal = buildElementStiffnessMatrix3D(mat.E, mat.G, sec.A, sec.Iz, sec.Iy, sec.J, L);
    const T_trans = transpose(T);
    const kGlobal = multiply(T_trans, multiply(kLocal, T));
    return { kLocal, kGlobal, T, L };
  }
}
