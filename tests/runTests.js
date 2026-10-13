// =============================================================================
// tests/runTests.js — Executor e Relatório de Todas as Suítes de Teste
// Estrutural Lab 3D
// =============================================================================

import { runBeamTests } from './beam.test.js';
import { runFrame2DTests } from './frame2D.test.js';
import { runFrame3DTests } from './frame3D.test.js';
import { runLoadsTests } from './loads.test.js';
import { runSerializationTests } from './modelSerialization.test.js';

export function runAllSuites() {
  const suites = [
    runBeamTests(),
    runFrame2DTests(),
    runFrame3DTests(),
    runLoadsTests(),
    runSerializationTests()
  ];

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  console.log('=============================================================================');
  console.log('   ESTRUTURAL LAB 3D — RELATÓRIO DE TESTES AUTOMATIZADOS');
  console.log('=============================================================================');

  suites.forEach(s => {
    console.log(`\n📦 Suíte: ${s.suite}`);
    s.results.forEach(t => {
      totalTests++;
      if (t.passed) {
        totalPassed++;
        console.log(`  ✅ [PASS] ${t.testName} (erro: ${t.errorPct.toFixed(3)}%)`);
      } else {
        totalFailed++;
        console.error(`  ❌ [FAIL] ${t.testName} (esperado: ${t.expected}, obtido: ${t.actual})`);
      }
    });
  });

  console.log('\n-----------------------------------------------------------------------------');
  console.log(`Total: ${totalTests} testes | Aprovados: ${totalPassed} | Falhas: ${totalFailed}`);
  console.log('=============================================================================\n');

  return {
    suites,
    totalTests,
    totalPassed,
    totalFailed,
    allPassed: totalFailed === 0
  };
}

// Execução direta via Node.js (se suportado)
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('runTests.js')) {
  const summary = runAllSuites();
  if (!summary.allPassed) {
    process.exit(1);
  }
}
