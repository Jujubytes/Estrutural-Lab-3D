// =============================================================================
// src/persistence/saveModel.js — Exportação de Arquivos JSON para Download
// Estrutural Lab 3D
// =============================================================================

import { serializeModel } from './modelSerializer.js';

export function saveModelToFile(model, filename = 'modelo_estrutural.json') {
  const json = serializeModel(model);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
