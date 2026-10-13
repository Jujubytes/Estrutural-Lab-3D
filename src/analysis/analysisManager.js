// =============================================================================
// src/analysis/analysisManager.js — Gerenciador e Coordenador da Análise Estrutural
// Estrutural Lab 3D
// =============================================================================

import { checkStructuralStability } from './stabilityChecks.js';
import { assembleGlobalSystem } from './globalAssembly.js';
import { applyBoundaryConditions } from './boundaryConditions.js';
import { solveDisplacements } from './linearSolver.js';
import { computeReactions, checkGlobalEquilibrium } from './reactions.js';
import { computeElementInternalForces } from './internalForces.js';

export class AnalysisResult {
  constructor({
    success,
    error = null,
    displacements = new Map(),
    reactions = new Map(),
    elementForces = new Map(),
    deformedPositions = new Map(),
    maxDisplacement = 0,
    equilibrium = null
  }) {
    this.success = success;
    this.error = error;
    this.displacements = displacements;
    this.reactions = reactions;
    this.elementForces = elementForces;
    this.deformedPositions = deformedPositions;
    this.maxDisplacement = maxDisplacement;
    this.equilibrium = equilibrium;
  }
}

/**
 * Executa a análise estrutural estática linear completa no modelo fornecido.
 *
 * @param {StructuralModel} model Modelo estrutural
 * @returns {AnalysisResult} Objeto estruturado com os resultados do cálculo
 */
export function analyzeStructure(model) {
  try {
    // 1. Validação prévia de geometria
    const geomValidation = model.validate();
    if (!geomValidation.valid) {
      return new AnalysisResult({
        success: false,
        error: `Erros de geometria:\n${geomValidation.errors.join('; ')}`
      });
    }

    // 2. Verificação de estabilidade cinemática
    const stability = checkStructuralStability(model);
    if (!stability.stable) {
      return new AnalysisResult({
        success: false,
        error: `Instabilidade cinemática:\n${stability.errors.join('; ')}`
      });
    }

    // 3. Montagem do sistema global K e F
    const { K, F, dofMap, totalDofs, elementAssemblyData } = assembleGlobalSystem(model);

    // 4. Aplicação das condições de contorno (particionamento)
    const { K_ff, F_f, K_rf, F_r, freeDofs, restrainedDofs } = applyBoundaryConditions(
      model, K, F, dofMap, totalDofs
    );

    // 5. Resolução dos deslocamentos nodais
    const { U_f, U_global, displacements, maxDisplacement } = solveDisplacements(
      K_ff, F_f, freeDofs, totalDofs, dofMap, model.dimension
    );

    // 6. Cálculo das reações de apoio
    const reactions = computeReactions(K_rf, F_r, U_f, restrainedDofs, dofMap, model);

    // 7. Recuperação dos esforços internos nas barras
    const elementForces = computeElementInternalForces(
      model, U_global, dofMap, elementAssemblyData, 21
    );

    // 8. Posições nodais deformadas básicas (escala 1x)
    const deformedPositions = new Map();
    for (const node of model.getNodes()) {
      const disp = displacements.get(node.id) || { ux: 0, uy: 0, uz: 0 };
      deformedPositions.set(node.id, {
        x: node.x + disp.ux,
        y: node.y + disp.uy,
        z: node.z + disp.uz
      });
    }

    // 9. Verificação de equilíbrio estático
    const equilibrium = checkGlobalEquilibrium(model, reactions);

    return new AnalysisResult({
      success: true,
      displacements,
      reactions,
      elementForces,
      deformedPositions,
      maxDisplacement,
      equilibrium
    });
  } catch (err) {
    return new AnalysisResult({
      success: false,
      error: err.message || 'Erro inesperado durante a execução da análise MEF.'
    });
  }
}
