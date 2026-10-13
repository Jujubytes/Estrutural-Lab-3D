// =============================================================================
// tests/frame3D.test.js — Testes Unitários de Pórtico Espacial 3D
// Estrutural Lab 3D
// =============================================================================

import { StructuralModel } from '../src/model/structuralModel.js';
import { analyzeStructure } from '../src/analysis/analysisManager.js';

export function runFrame3DTests() {
  const suiteResults = [];

  // Cria pórtico espacial em L: nó 0 engastado na origem (0,0,0), nó 1 em (0, 4, 0), nó 2 em (5, 4, 3)
  const model = new StructuralModel('3D');
  model.addNode('n0', 0, 0, 0);
  model.addNode('n1', 0, 4, 0);
  model.addNode('n2', 5, 4, 3);

  model.addElement('col', 'n0', 'n1', 'mat_steel_a36', 'sec_column_30x30');
  model.addElement('beam', 'n1', 'n2', 'mat_steel_a36', 'sec_20x40');

  // Engaste espacial completo na base (n0)
  model.setSupport('n0', { ux: true, uy: true, uz: true, rx: true, ry: true, rz: true });

  // Carga triaxial no nó 2 da extremidade livre
  model.addNodeLoad('load_tip', 'n2', { fx: 10, fy: -25, fz: 15 });

  const res = analyzeStructure(model);

  // 1. Resolução MEF 3D com sucesso
  suiteResults.push({
    testName: 'Pórtico Espacial 3D — Resolução MEF sem Erros',
    passed: res.success === true,
    expected: true,
    actual: res.success,
    errorPct: 0
  });

  // 2. Equilíbrio Espacial X
  suiteResults.push({
    testName: 'Pórtico Espacial 3D — Equilíbrio Global X (ΣFx = 0)',
    passed: Math.abs(res.equilibrium.diffX) < 1e-4,
    expected: 0,
    actual: res.equilibrium.diffX,
    errorPct: Math.abs(res.equilibrium.diffX)
  });

  // 3. Equilíbrio Espacial Y
  suiteResults.push({
    testName: 'Pórtico Espacial 3D — Equilíbrio Global Y (ΣFy = 0)',
    passed: Math.abs(res.equilibrium.diffY) < 1e-4,
    expected: 0,
    actual: res.equilibrium.diffY,
    errorPct: Math.abs(res.equilibrium.diffY)
  });

  // 4. Equilíbrio Espacial Z
  suiteResults.push({
    testName: 'Pórtico Espacial 3D — Equilíbrio Global Z (ΣFz = 0)',
    passed: Math.abs(res.equilibrium.diffZ) < 1e-4,
    expected: 0,
    actual: res.equilibrium.diffZ,
    errorPct: Math.abs(res.equilibrium.diffZ)
  });

  return { suite: 'Pórtico Espacial 3D (Frame3D Tests)', results: suiteResults };
}
