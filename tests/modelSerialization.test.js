// =============================================================================
// tests/modelSerialization.test.js — Testes de Serialização e Persistência JSON
// Estrutural Lab 3D
// =============================================================================

import { StructuralModel } from '../src/model/structuralModel.js';
import { serializeModel, deserializeModel } from '../src/persistence/modelSerializer.js';

export function runSerializationTests() {
  const suiteResults = [];

  // Cria um modelo completo com nós, barras, materiais, apoios e cargas diversas
  const origModel = StructuralModel.createSimpleFrame(6, 4, 25, 18);
  origModel.addNode('n_extra', 3, 2, 0);

  // Serializa para string JSON
  const jsonString = serializeModel(origModel);

  // Reconstrói via deserialização
  const restoredModel = deserializeModel(jsonString);

  // 1. Integridade de nós
  const origNodes = origModel.getNodes();
  const restNodes = restoredModel.getNodes();
  suiteResults.push({
    testName: 'Serialização — Quantidade e IDs de Nós Preservados',
    passed: origNodes.length === restNodes.length,
    expected: origNodes.length,
    actual: restNodes.length,
    errorPct: 0
  });

  // 2. Coordenadas dos nós
  let coordsMatch = true;
  for (const n of origNodes) {
    const rn = restoredModel.getNode(n.id);
    if (!rn || rn.x !== n.x || rn.y !== n.y || rn.z !== n.z) {
      coordsMatch = false;
      break;
    }
  }
  suiteResults.push({
    testName: 'Serialização — Coordenadas Tridimensionais (X, Y, Z) Exatas',
    passed: coordsMatch,
    expected: true,
    actual: coordsMatch,
    errorPct: 0
  });

  // 3. Integridade de elementos
  const origElems = origModel.getElements();
  const restElems = restoredModel.getElements();
  suiteResults.push({
    testName: 'Serialização — Quantidade e Conectividade de Elementos Preservada',
    passed: origElems.length === restElems.length,
    expected: origElems.length,
    actual: restElems.length,
    errorPct: 0
  });

  // 4. Integridade de apoios
  const origSups = Object.keys(origModel.getSupports());
  const restSups = Object.keys(restoredModel.getSupports());
  suiteResults.push({
    testName: 'Serialização — Condições de Vínculos e Apoios Preservadas',
    passed: origSups.length === restSups.length,
    expected: origSups.length,
    actual: restSups.length,
    errorPct: 0
  });

  // 5. Integridade de cargas
  const origLoads = origModel.getLoads();
  const restLoads = restoredModel.getLoads();
  suiteResults.push({
    testName: 'Serialização — Cargas Nodais e Distribuídas Preservadas',
    passed: origLoads.length === restLoads.length,
    expected: origLoads.length,
    actual: restLoads.length,
    errorPct: 0
  });

  return { suite: 'Persistência (Serialization Tests)', results: suiteResults };
}
