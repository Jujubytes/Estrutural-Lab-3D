// =============================================================================
// src/model/materials.js — Materiais Estruturais e Biblioteca Padrão
// Estrutural Lab 3D
// =============================================================================

export class Material {
  constructor(id, { name, E, G = null, nu = 0.2, rho = 25 }) {
    this.id = String(id);
    this.name = String(name || id);
    this.E = Number(E); // kN/m²
    this.nu = Number(nu);
    // Se G não for especificado, calcula por G = E / (2 * (1 + nu))
    this.G = G !== null ? Number(G) : this.E / (2 * (1 + this.nu));
    this.rho = Number(rho); // kN/m³
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      E: this.E,
      G: this.G,
      nu: this.nu,
      rho: this.rho
    };
  }

  static fromJSON(data) {
    return new Material(data.id, data);
  }
}

/**
 * Biblioteca de Materiais Pré-cadastrados (Valores em unidades SI de engenharia: kN, m)
 */
export const DEFAULT_MATERIALS = {
  mat_concrete: new Material('mat_concrete', {
    name: 'Concreto C25',
    E: 25.0e6, // 25.000 MPa = 25 GPa = 25.000.000 kN/m²
    nu: 0.2,
    rho: 25.0
  }),
  mat_concrete_c30: new Material('mat_concrete_c30', {
    name: 'Concreto C30',
    E: 31.0e6, // 31.000 MPa
    nu: 0.2,
    rho: 25.0
  }),
  mat_steel_a36: new Material('mat_steel_a36', {
    name: 'Aço Estrutural ASTM A36',
    E: 200.0e6, // 200.000 MPa = 200 GPa
    nu: 0.3,
    rho: 78.5
  })
};
