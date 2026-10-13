// =============================================================================
// src/utils/math.js — Operações Matemáticas, Vetoriais e Álgebra Linear
// Estrutural Lab 3D
// =============================================================================

import { SingularMatrixError } from './errors.js';

/**
 * Cria uma matriz m x n preenchida com um valor padrão.
 */
export function createMatrix(rows, cols, fill = 0) {
  const m = new Array(rows);
  for (let i = 0; i < rows; i++) {
    m[i] = new Float64Array(cols);
    if (fill !== 0) m[i].fill(fill);
  }
  return m;
}

/**
 * Cria uma matriz identidade de ordem n.
 */
export function identityMatrix(size) {
  const m = createMatrix(size, size, 0);
  for (let i = 0; i < size; i++) {
    m[i][i] = 1;
  }
  return m;
}

/**
 * Retorna a transposta de uma matriz.
 */
export function transpose(mat) {
  const rows = mat.length;
  const cols = mat[0].length;
  const t = createMatrix(cols, rows, 0);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      t[j][i] = mat[i][j];
    }
  }
  return t;
}

/**
 * Multiplicação de matrizes C = A * B.
 */
export function multiply(A, B) {
  const rA = A.length;
  const cA = A[0].length;
  const rB = B.length;
  const cB = B[0].length;

  if (cA !== rB) {
    throw new Error(`Incompatibilidade de dimensões na multiplicação: (${rA}x${cA}) * (${rB}x${cB})`);
  }

  const C = createMatrix(rA, cB, 0);
  for (let i = 0; i < rA; i++) {
    for (let k = 0; k < cA; k++) {
      const aVal = A[i][k];
      if (Math.abs(aVal) > 1e-15) {
        for (let j = 0; j < cB; j++) {
          C[i][j] += aVal * B[k][j];
        }
      }
    }
  }
  return C;
}

/**
 * Multiplicação matriz por vetor: y = A * x.
 */
export function multiplyVec(A, x) {
  const rows = A.length;
  const cols = A[0].length;
  const y = new Float64Array(rows);
  for (let i = 0; i < rows; i++) {
    let sum = 0;
    for (let j = 0; j < cols; j++) {
      sum += A[i][j] * x[j];
    }
    y[i] = sum;
  }
  return y;
}

/**
 * Adição de matrizes C = A + B.
 */
export function addMatrices(A, B) {
  const rows = A.length;
  const cols = A[0].length;
  const C = createMatrix(rows, cols, 0);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      C[i][j] = A[i][j] + B[i][j];
    }
  }
  return C;
}

/**
 * Subtração de matrizes C = A - B.
 */
export function subtractMatrices(A, B) {
  const rows = A.length;
  const cols = A[0].length;
  const C = createMatrix(rows, cols, 0);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      C[i][j] = A[i][j] - B[i][j];
    }
  }
  return C;
}

/**
 * Resolve o sistema linear A * x = b usando Eliminação Gaussiana com Pivoteamento Parcial.
 * @param {Array<Array<number>>} A Matriz de coeficientes n x n (não modificada)
 * @param {Array<number>|Float64Array} b Vetor de termos independentes
 * @returns {Float64Array} Vetor solução x
 */
export function solveLinearSystem(A, b) {
  const n = A.length;
  if (n === 0) return new Float64Array(0);

  // Clona A e b em memória contígua para não modificar os originais
  const M = new Array(n);
  const rhs = new Float64Array(b);
  for (let i = 0; i < n; i++) {
    M[i] = new Float64Array(A[i]);
  }

  // Eliminação direta com pivoteamento parcial
  for (let k = 0; k < n; k++) {
    // Procura o maior pivô na coluna k
    let maxRow = k;
    let maxVal = Math.abs(M[k][k]);
    for (let r = k + 1; r < n; r++) {
      const val = Math.abs(M[r][k]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = r;
      }
    }

    if (maxVal < 1e-12) {
      throw new SingularMatrixError(
        `Matriz singular detectada no grau de liberdade ${k} (pivô máximo = ${maxVal.toExponential(3)}). A estrutura é cinematicamente instável.`
      );
    }

    // Troca de linhas se necessário
    if (maxRow !== k) {
      const tempRow = M[k];
      M[k] = M[maxRow];
      M[maxRow] = tempRow;

      const tempRhs = rhs[k];
      rhs[k] = rhs[maxRow];
      rhs[maxRow] = tempRhs;
    }

    // Eliminação abaixo do pivô
    const pivot = M[k][k];
    for (let i = k + 1; i < n; i++) {
      const factor = M[i][k] / pivot;
      if (Math.abs(factor) > 1e-15) {
        for (let j = k + 1; j < n; j++) {
          M[i][j] -= factor * M[k][j];
        }
        rhs[i] -= factor * rhs[k];
      }
      M[i][k] = 0;
    }
  }

  // Substituição regressiva
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = rhs[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}

// =============================================================================
// Funções Vetoriais Auxiliares (3D / 2D)
// =============================================================================

export function vecLength(v) {
  return Math.sqrt(v[0] * v[0] + v[1] * v[1] + (v[2] || 0) * (v[2] || 0));
}

export function vecNormalize(v) {
  const len = vecLength(v);
  if (len < 1e-12) return [0, 0, 0];
  return [v[0] / len, v[1] / len, (v[2] || 0) / len];
}

export function vecDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + (a[2] || 0) * (b[2] || 0);
}

export function vecCross(a, b) {
  const ax = a[0], ay = a[1], az = a[2] || 0;
  const bx = b[0], by = b[1], bz = b[2] || 0;
  return [
    ay * bz - az * by,
    az * bx - ax * bz,
    ax * by - ay * bx
  ];
}

export function vecSub(a, b) {
  return [a[0] - b[0], a[1] - b[1], (a[2] || 0) - (b[2] || 0)];
}

export function vecAdd(a, b) {
  return [a[0] + b[0], a[1] + b[1], (a[2] || 0) + (b[2] || 0)];
}

export function vecScale(v, s) {
  return [v[0] * s, v[1] * s, (v[2] || 0) * s];
}
