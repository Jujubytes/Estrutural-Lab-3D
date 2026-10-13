// =============================================================================
// src/persistence/modelSerializer.js — Serialização e Validação de Esquema JSON
// Estrutural Lab 3D
// =============================================================================

import { StructuralModel } from '../model/structuralModel.js';
import { ValidationError } from '../utils/errors.js';

export function serializeModel(model) {
  return JSON.stringify(model.toJSON(), null, 2);
}

export function deserializeModel(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      throw new ValidationError('O arquivo JSON não contém um objeto válido.');
    }
    return StructuralModel.fromJSON(data);
  } catch (err) {
    if (err instanceof ValidationError) throw err;
    throw new ValidationError(`Falha ao ler o arquivo JSON: ${err.message}`);
  }
}
