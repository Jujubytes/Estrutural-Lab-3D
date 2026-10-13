// =============================================================================
// tests/frame2D.test.js — Testes Unitários de Pórtico Plano 2D
// Estrutural Lab 3D
// =============================================================================

import { StructuralModel } from '../src/model/structuralModel.js';
import { analyzeStructure } from '../src/analysis/analysisManager.js';

export function runFrame2DTests() {
  const suiteResults = [];

  // Pórtico Simples com Vento e Carga de Viga
  // L = 6m, H = 4m, P_horiz = 20 kN, q_beam = 15 kN/m
  const model = StructuralModel.createSimpleFrame(6, 4, 20, 15);
  const res = analyzeStructure(model);

  const eq = res.equilibrium;

  // 1. Verificação de Sucesso da Análise
  suiteResults.push({
    testName: 'Pórtico 2D — Resolução MEF sem Singularidades',
    passed: res.success === true,
    expected: true,
    actual: res.success,
    errorPct: 0
  });

  // 2. Equilíbrio de Forças Horizontais ΣFx = 0
  suiteResults.push({
    testName: 'Pórtico 2D — Equilíbrio Estático Horizontal (ΣFx = 0)',
    passed: Math.abs(eq.diffX) < 1e-4,
    expected: 0,
    actual: eq.diffX,
    errorPct: Math.abs(eq.diffX)
  });

  // 3. Equilíbrio de Forças Verticais ΣFy = 0
  // Carga vertical total = 15 kN/m * 6m = 90 kN
  suiteResults.push({
    testName: 'Pórtico 2D — Equilíbrio Estático Vertical (ΣFy = 0)',
    passed: Math.abs(eq.diffY) < 1e-4,
    expected: 0,
    actual: eq.diffY,
    errorPct: Math.abs(eq.diffY)
  });

  // 4. Verificação de Simetria de Reações Verticais sob Carga Simétrica
  {
    const symModel = StructuralModel.createSimpleFrame(6, 4, 0, 20); // sem vento, q = 20
    const symRes = analyzeStructure(symModel);
    const r0 = symRes.reactions.get('n0');
    const r3 = symRes.reactions.get('n3');

    // Carga total = 20 * 6 = 120 kN => cada pilar recebe 60 kN
    const expectedRy = 60.0;
    const diffR0 = Math.abs(Math.abs(r0.fy) - expectedRy);
    const diffR3 = Math.abs(Math.abs(r3.fy) - expectedRy);

    suiteResults.push({
      testName: 'Pórtico 2D Simétrico — Reação Vertical Pilar Esquerdo Ry = 60 kN',
      passed: diffR0 < 0.05,
      expected: expectedRy,
      actual: Math.abs(r0.fy),
      errorPct: (diffR0 / expectedRy) * 100
    });

    suiteResults.push({
      testName: 'Pórtico 2D Simétrico — Reação Vertical Pilar Direito Ry = 60 kN',
      passed: diffR3 < 0.05,
      expected: expectedRy,
      actual: Math.abs(r3.fy),
      errorPct: (diffR3 / expectedRy) * 100
    });
  }

  return { suite: 'Pórtico 2D (Frame2D Tests)', results: suiteResults };
}
