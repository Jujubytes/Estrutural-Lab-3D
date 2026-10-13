// =============================================================================
// src/analysis/coordinateTransform.js — Matrizes de Transformação de Coordenadas
// Estrutural Lab 3D
// =============================================================================

import { createMatrix } from '../utils/math.js';

/**
 * Cria a matriz de transformação 2D (6 x 6) de coordenadas locais para globais.
 * DOF order: [u1, v1, θz1, u2, v2, θz2]
 *
 * T = [
 *   [ c,  s,  0,  0,  0,  0 ],
 *   [-s,  c,  0,  0,  0,  0 ],
 *   [ 0,  0,  1,  0,  0,  0 ],
 *   [ 0,  0,  0,  c,  s,  0 ],
 *   [ 0,  0,  0, -s,  c,  0 ],
 *   [ 0,  0,  0,  0,  0,  1 ]
 * ]
 */
export function buildTransformMatrix2D(node1, node2) {
  const dx = node2.x - node1.x;
  const dy = node2.y - node1.y;
  const L = Math.sqrt(dx * dx + dy * dy);

  if (L < 1e-9) throw new Error('Elemento com comprimento nulo em buildTransformMatrix2D');

  const c = dx / L;
  const s = dy / L;

  const T = createMatrix(6, 6, 0);

  // Nó 1
  T[0][0] = c;  T[0][1] = s;
  T[1][0] = -s; T[1][1] = c;
  T[2][2] = 1;

  // Nó 2
  T[3][3] = c;  T[3][4] = s;
  T[4][3] = -s; T[4][4] = c;
  T[5][5] = 1;

  return { T, L, c, s };
}

/**
 * Cria a matriz de transformação 3D (12 x 12).
 * DOF order: [u1, v1, w1, rx1, ry1, rz1, u2, v2, w2, rx2, ry2, rz2]
 */
export function buildTransformMatrix3D(node1, node2, element) {
  const L = node1.distanceTo(node2);
  if (L < 1e-9) throw new Error('Elemento com comprimento nulo em buildTransformMatrix3D');

  const { xLocal, yLocal, zLocal } = element.getLocalAxes(node1, node2);

  // Matriz de rotação 3x3 r = [xLocal, yLocal, zLocal]^T
  const r = [
    [xLocal[0], xLocal[1], xLocal[2]],
    [yLocal[0], yLocal[1], yLocal[2]],
    [zLocal[0], zLocal[1], zLocal[2]]
  ];

  const T = createMatrix(12, 12, 0);

  // Preenche os 4 blocos 3x3 na diagonal principal
  for (let block = 0; block < 4; block++) {
    const offset = block * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        T[offset + i][offset + j] = r[i][j];
      }
    }
  }

  return { T, L, xLocal, yLocal, zLocal };
}
