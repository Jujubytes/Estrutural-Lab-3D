// =============================================================================
// src/utils/errors.js — Classes de Erros Personalizados da Aplicação
// Estrutural Lab 3D
// =============================================================================

export class StructuralError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'StructuralError';
    this.details = details;
  }
}

export class ValidationError extends StructuralError {
  constructor(message, details = null) {
    super(message, details);
    this.name = 'ValidationError';
  }
}

export class SingularMatrixError extends StructuralError {
  constructor(message = 'A matriz de rigidez global é singular. A estrutura é instável ou possui nós sem restrição adequada.', details = null) {
    super(message, details);
    this.name = 'SingularMatrixError';
  }
}
