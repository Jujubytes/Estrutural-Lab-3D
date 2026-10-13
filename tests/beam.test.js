// =============================================================================
// tests/beam.test.js — Testes Unitários e Benchmarks de Vigas (MEF vs Solução Analítica)
// Estrutural Lab 3D
// =============================================================================

import { StructuralModel } from '../src/model/structuralModel.js';
import { analyzeStructure } from '../src/analysis/analysisManager.js';

export function runBeamTests() {
  const suiteResults = [];

  // ===========================================================================
  // Caso 1: Viga Biapoiada com Carga Pontual no Meio do Vão
  // L = 8m, P = 100kN, C25 (E = 25e6 kN/m²), Seção 20x40 cm (Iz = 0.001066667 m⁴)
  // ===========================================================================
  {
    const L = 8.0;
    const P = 100.0;
    const model = StructuralModel.createSimplySupportedBeam(L, P);
    const res = analyzeStructure(model);

    const E = 25e6;
    const Iz = (0.2 * Math.pow(0.4, 3)) / 12;

    const exactDisp = (P * Math.pow(L, 3)) / (48 * E * Iz); // ~0.000999999 m
    const exactMoment = (P * L) / 4; // 200 kNm
    const exactReaction = P / 2; // 50 kN

    const femDisp = Math.abs(res.displacements.get('n1').uy);
    const femReaction = Math.abs(res.reactions.get('n0').fy);
    const ef = res.elementForces.get('e0');
    const femMoment = Math.max(...ef.Mz.map(Math.abs));

    const errDisp = Math.abs(femDisp - exactDisp) / exactDisp;
    const errMoment = Math.abs(femMoment - exactMoment) / exactMoment;
    const errReaction = Math.abs(femReaction - exactReaction) / exactReaction;

    suiteResults.push({
      testName: 'Viga Biapoiada — Deslocamento Central δ = PL³/(48EI)',
      passed: errDisp < 0.005,
      expected: exactDisp,
      actual: femDisp,
      errorPct: errDisp * 100
    });

    suiteResults.push({
      testName: 'Viga Biapoiada — Momento Fletor Máximo M = PL/4',
      passed: errMoment < 0.001,
      expected: exactMoment,
      actual: femMoment,
      errorPct: errMoment * 100
    });

    suiteResults.push({
      testName: 'Viga Biapoiada — Reação Vertical de Apoio R = P/2',
      passed: errReaction < 0.001,
      expected: exactReaction,
      actual: femReaction,
      errorPct: errReaction * 100
    });
  }

  // ===========================================================================
  // Caso 2: Viga em Balanço (Engaste e Extremidade Livre com Carga Concentrada)
  // L = 4m, P = 50kN
  // ===========================================================================
  {
    const L = 4.0;
    const P = 50.0;
    const model = StructuralModel.createCantileverBeam(L, P);
    const res = analyzeStructure(model);

    const E = 25e6;
    const Iz = (0.2 * Math.pow(0.4, 3)) / 12;

    const exactDisp = (P * Math.pow(L, 3)) / (3 * E * Iz);
    const exactMoment = P * L; // 200 kNm
    const exactReaction = P; // 50 kN

    const femDisp = Math.abs(res.displacements.get('n1').uy);
    const r = res.reactions.get('n0');
    const femReaction = Math.abs(r.fy);
    const femMoment = Math.abs(r.mz);

    const errDisp = Math.abs(femDisp - exactDisp) / exactDisp;
    const errMoment = Math.abs(femMoment - exactMoment) / exactMoment;
    const errReaction = Math.abs(femReaction - exactReaction) / exactReaction;

    suiteResults.push({
      testName: 'Viga em Balanço — Flecha na Extremidade Livre δ = PL³/(3EI)',
      passed: errDisp < 0.005,
      expected: exactDisp,
      actual: femDisp,
      errorPct: errDisp * 100
    });

    suiteResults.push({
      testName: 'Viga em Balanço — Momento de Engaste M = P·L',
      passed: errMoment < 0.001,
      expected: exactMoment,
      actual: femMoment,
      errorPct: errMoment * 100
    });

    suiteResults.push({
      testName: 'Viga em Balanço — Reação de Apoio Vertical R = P',
      passed: errReaction < 0.001,
      expected: exactReaction,
      actual: femReaction,
      errorPct: errReaction * 100
    });
  }

  return { suite: 'Vigas (Beam Tests)', results: suiteResults };
}
