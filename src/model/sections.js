// =============================================================================
// src/model/sections.js — Seções Transversais e Calculadora Geométrica
// Estrutural Lab 3D
// =============================================================================

import { validateRectSectionInputs } from '../utils/validation.js';

export class Section {
  constructor(id, { name, A, Iz, Iy = null, J = null }) {
    this.id = String(id);
    this.name = String(name || id);
    this.A = Number(A);       // m²
    this.Iz = Number(Iz);     // m⁴ (inércia em torno do eixo z local - flexão principal)
    this.Iy = Iy !== null ? Number(Iy) : Number(Iz); // m⁴
    this.J = J !== null ? Number(J) : (this.Iz + this.Iy) * 0.5; // m⁴ (inércia à torção)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      A: this.A,
      Iz: this.Iz,
      Iy: this.Iy,
      J: this.J
    };
  }

  static fromJSON(data) {
    return new Section(data.id, data);
  }
}

/**
 * Calcula propriedades geométricas exatas de uma seção retangular b x h (em centímetros).
 * Retorna valores no Sistema Internacional (metros).
 */
export function computeRectangularSection(b_cm, h_cm) {
  validateRectSectionInputs(b_cm, h_cm);

  const b = b_cm / 100; // metros
  const h = h_cm / 100; // metros

  const A = b * h;
  const Iz = (b * Math.pow(h, 3)) / 12; // Inércia no plano de flexão vertical
  const Iy = (h * Math.pow(b, 3)) / 12; // Inércia no plano de flexão horizontal

  // Constante de torção aproximada para seção retangular maciça
  const bMin = Math.min(b, h);
  const bMax = Math.max(b, h);
  const beta = (1 / 3) * (1 - 0.63 * (bMin / bMax));
  const J = beta * bMax * Math.pow(bMin, 3);

  return { A, Iz, Iy, J, b, h };
}

/**
 * Biblioteca de Seções Pré-cadastradas
 */
export const DEFAULT_SECTIONS = {
  sec_20x40: new Section('sec_20x40', {
    name: 'Viga 20x40 cm',
    ...computeRectangularSection(20, 40)
  }),
  sec_30x50: new Section('sec_30x50', {
    name: 'Viga 30x50 cm',
    ...computeRectangularSection(30, 50)
  }),
  sec_column_30x30: new Section('sec_column_30x30', {
    name: 'Pilar 30x30 cm',
    ...computeRectangularSection(30, 30)
  })
};
