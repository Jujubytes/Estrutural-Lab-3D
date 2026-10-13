// =============================================================================
// src/analysis/stabilityChecks.js — Verificação de Estabilidade Cinemática e Mecanismos
// Estrutural Lab 3D
// =============================================================================

export function checkStructuralStability(model) {
  const errors = [];
  const dimension = model.dimension;

  const nodes = model.getNodes();
  const elements = model.getElements();
  const supports = model.getSupports();

  if (nodes.length < 2) {
    errors.push('A estrutura precisa de pelo menos 2 nós definidos.');
    return { stable: false, errors };
  }

  if (elements.length < 1) {
    errors.push('A estrutura precisa de pelo menos 1 elemento de barra.');
    return { stable: false, errors };
  }

  // 1. Contagem de reações mínimas
  let totalRestraints = 0;
  let hasRestraintX = false;
  let hasRestraintY = false;
  let hasRestraintZ = false;

  for (const sup of Object.values(supports)) {
    if (sup.ux) { totalRestraints++; hasRestraintX = true; }
    if (sup.uy) { totalRestraints++; hasRestraintY = true; }
    if (sup.uz) { totalRestraints++; hasRestraintZ = true; }
    if (sup.rx) totalRestraints++;
    if (sup.ry) totalRestraints++;
    if (sup.rz) totalRestraints++;
  }

  const minRequired = dimension === '2D' ? 3 : 6;
  if (totalRestraints < minRequired) {
    errors.push(
      `Número insuficiente de vínculos (${totalRestraints}/${minRequired} restrições). A estrutura é hipostática e se comporta como mecanismo livre.`
    );
  }

  if (!hasRestraintX) {
    errors.push('A estrutura não possui nenhuma restrição de translação no eixo horizontal X (instabilidade por corpo rígido).');
  }
  if (!hasRestraintY) {
    errors.push('A estrutura não possui nenhuma restrição de translação no eixo vertical Y (instabilidade por corpo rígido).');
  }
  if (dimension === '3D' && !hasRestraintZ) {
    errors.push('A estrutura 3D não possui nenhuma restrição de translação no eixo transversal Z.');
  }

  // 2. Verificação de nós isolados (sem nenhuma barra conectada)
  const connectedNodeIds = new Set();
  elements.forEach(el => {
    connectedNodeIds.add(el.n1);
    connectedNodeIds.add(el.n2);
  });

  nodes.forEach(n => {
    if (!connectedNodeIds.has(n.id)) {
      errors.push(`O nó "${n.id}" está desconectado de qualquer elemento de barra.`);
    }
  });

  return {
    stable: errors.length === 0,
    errors
  };
}
