// =============================================================================
// src/results/forceDiagrams.js — Processamento de Dados para Diagramas de Esforços
// Estrutural Lab 3D
// =============================================================================

/**
 * Calcula o valor máximo absoluto de um esforço (N, V ou M) em toda a estrutura,
 * garantindo uma escala proporcional para visualização gráfica 3D.
 */
export function getGlobalDiagramMax(model, analysisResult, diagramType) {
  if (!analysisResult || !analysisResult.success || diagramType === 'none') return 1;

  let maxVal = 0;
  const elements = model.getElements();

  for (const el of elements) {
    const ef = analysisResult.elementForces instanceof Map
      ? analysisResult.elementForces.get(el.id)
      : analysisResult.elementForces[el.id];

    if (!ef) continue;

    let arr = null;
    if (diagramType === 'N') arr = ef.N;
    else if (diagramType === 'V') arr = ef.Vy;
    else if (diagramType === 'M') arr = ef.Mz;

    if (arr && arr.length > 0) {
      for (const val of arr) {
        const abs = Math.abs(val);
        if (abs > maxVal) maxVal = abs;
      }
    }
  }

  return Math.max(maxVal, 1e-4);
}
