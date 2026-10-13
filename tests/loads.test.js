// =============================================================================
// tests/loads.test.js — Testes Unitários de Carregamentos e Cargas Equivalentes
// Estrutural Lab 3D
// =============================================================================

import { DistributedLoad } from '../src/loads/distributedLoads.js';
import { computeEquivalentNodalLoads } from '../src/loads/loadCases.js';

export function runLoadsTests() {
  const suiteResults = [];

  // 1. Carga Uniforme: q = -12 kN/m, L = 6m
  {
    const L = 6.0;
    const q = -12.0;
    const distLoad = new DistributedLoad('d1', 'e0', { direction: 'y', q0: q, q1: q });
    const fEq = computeEquivalentNodalLoads(distLoad, L, '2D');

    // V1 = qL / 2 = -12 * 6 / 2 = -36 kN
    // M1 = qL² / 12 = -12 * 36 / 12 = -36 kNm
    // V2 = -36 kN
    // M2 = -(-36) = +36 kNm

    const expectedV = q * L / 2;
    const expectedM = q * L * L / 12;

    const diffV1 = Math.abs(fEq[1] - expectedV);
    const diffM1 = Math.abs(fEq[2] - expectedM);
    const diffV2 = Math.abs(fEq[4] - expectedV);
    const diffM2 = Math.abs(fEq[5] - (-expectedM));

    suiteResults.push({
      testName: 'Carga Uniforme — Força Nodal Equivalente V1 = qL/2',
      passed: diffV1 < 1e-6,
      expected: expectedV,
      actual: fEq[1],
      errorPct: 0
    });

    suiteResults.push({
      testName: 'Carga Uniforme — Momento de Engastamento Perfeito M1 = qL²/12',
      passed: diffM1 < 1e-6,
      expected: expectedM,
      actual: fEq[2],
      errorPct: 0
    });

    suiteResults.push({
      testName: 'Carga Uniforme — Equilíbrio Nodal V1 + V2 = q·L',
      passed: Math.abs((fEq[1] + fEq[4]) - (q * L)) < 1e-6,
      expected: q * L,
      actual: fEq[1] + fEq[4],
      errorPct: 0
    });
  }

  // 2. Carga Triangular: q0 = 0, q1 = -10 kN/m, L = 6m
  {
    const L = 6.0;
    const q1 = -10.0;
    const distLoad = new DistributedLoad('d2', 'e0', { direction: 'y', q0: 0, q1: q1 });
    const fEq = computeEquivalentNodalLoads(distLoad, L, '2D');

    // Total = 0.5 * (-10) * 6 = -30 kN
    // V1 = 3/20 * (-10) * 6 = -9 kN
    // V2 = 7/20 * (-10) * 6 = -21 kN
    const expectedV1 = -9.0;
    const expectedV2 = -21.0;

    suiteResults.push({
      testName: 'Carga Triangular — Reação Equivalente Nó 1 V1 = (3/20)·q·L',
      passed: Math.abs(fEq[1] - expectedV1) < 1e-6,
      expected: expectedV1,
      actual: fEq[1],
      errorPct: 0
    });

    suiteResults.push({
      testName: 'Carga Triangular — Reação Equivalente Nó 2 V2 = (7/20)·q·L',
      passed: Math.abs(fEq[4] - expectedV2) < 1e-6,
      expected: expectedV2,
      actual: fEq[4],
      errorPct: 0
    });
  }

  return { suite: 'Carregamentos (Loads Tests)', results: suiteResults };
}
