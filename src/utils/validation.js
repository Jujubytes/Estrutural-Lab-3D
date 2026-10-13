// =============================================================================
// src/utils/validation.js — Validação de Entradas e Consistência de Dados
// Estrutural Lab 3D
// =============================================================================

import { ValidationError } from './errors.js';

export function isValidId(id) {
  return typeof id === 'string' && id.trim().length > 0;
}

export function isFiniteNumber(val) {
  return typeof val === 'number' && Number.isFinite(val);
}

export function validateNodeInputs(id, x, y, z = 0) {
  if (!isValidId(id)) {
    throw new ValidationError('O identificador (ID) do nó deve ser um texto válido.');
  }
  if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
    throw new ValidationError(`As coordenadas do nó ${id} devem ser números finitos válidos.`);
  }
}

export function validateElementInputs(id, n1, n2, materialId, sectionId) {
  if (!isValidId(id)) {
    throw new ValidationError('O identificador (ID) do elemento deve ser um texto válido.');
  }
  if (!isValidId(n1) || !isValidId(n2)) {
    throw new ValidationError('Os nós inicial e final devem ser selecionados.');
  }
  if (n1 === n2) {
    throw new ValidationError(`O elemento ${id} não pode ter nós inicial e final idênticos (${n1}).`);
  }
  if (!isValidId(materialId)) {
    throw new ValidationError(`O elemento ${id} deve possuir um material associado.`);
  }
  if (!isValidId(sectionId)) {
    throw new ValidationError(`O elemento ${id} deve possuir uma seção transversal associada.`);
  }
}

export function validateRectSectionInputs(b_cm, h_cm) {
  if (!isFiniteNumber(b_cm) || b_cm <= 0) {
    throw new ValidationError('A largura da seção (b) deve ser um número positivo maior que zero.');
  }
  if (!isFiniteNumber(h_cm) || h_cm <= 0) {
    throw new ValidationError('A altura da seção (h) deve ser um número positivo maior que zero.');
  }
}
