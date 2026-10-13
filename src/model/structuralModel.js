// =============================================================================
// src/model/structuralModel.js — Gerenciador do Modelo Estrutural (FEA Model)
// Estrutural Lab 3D
// =============================================================================

import { Node } from './nodes.js';
import { Element } from './elements.js';
import { Material, DEFAULT_MATERIALS } from './materials.js';
import { Section, DEFAULT_SECTIONS } from './sections.js';
import { Support, createSupportPreset } from './supports.js';
import { PointLoad } from '../loads/pointLoads.js';
import { DistributedLoad } from '../loads/distributedLoads.js';
import { ValidationError } from '../utils/errors.js';

export class StructuralModel {
  constructor(dimension = '2D') {
    this.dimension = dimension; // '2D' | '3D'

    this.nodes = new Map();
    this.elements = new Map();
    this.materials = new Map();
    this.sections = new Map();
    this.supports = new Map();
    this.loads = new Map();

    // Carrega materiais e seções padrão
    this._initDefaults();
  }

  _initDefaults() {
    Object.values(DEFAULT_MATERIALS).forEach(mat => this.materials.set(mat.id, mat));
    Object.values(DEFAULT_SECTIONS).forEach(sec => this.sections.set(sec.id, sec));
  }

  clear() {
    this.nodes.clear();
    this.elements.clear();
    this.supports.clear();
    this.loads.clear();
  }

  // ===========================================================================
  // Gerenciamento de Nós
  // ===========================================================================

  addNode(id, x, y, z = 0) {
    const node = new Node(id, x, y, z);
    this.nodes.set(node.id, node);
    return node;
  }

  updateNode(id, x, y, z = 0) {
    if (!this.nodes.has(id)) {
      throw new ValidationError(`Nó com ID "${id}" não encontrado para atualização.`);
    }
    const node = new Node(id, x, y, z);
    this.nodes.set(id, node);
    return node;
  }

  removeNode(id) {
    // Remove também apoios e cargas vinculadas ao nó
    this.supports.delete(id);
    for (const [loadId, load] of this.loads.entries()) {
      if (load.nodeId === id) this.loads.delete(loadId);
    }
    // Remove elementos conectados ao nó
    for (const [elId, el] of this.elements.entries()) {
      if (el.n1 === id || el.n2 === id) this.elements.delete(elId);
    }
    return this.nodes.delete(id);
  }

  getNode(id) {
    return this.nodes.get(id);
  }

  getNodes() {
    return Array.from(this.nodes.values());
  }

  // ===========================================================================
  // Gerenciamento de Elementos (Barras)
  // ===========================================================================

  addElement(id, n1, n2, materialId = 'mat_concrete', sectionId = 'sec_20x40') {
    if (!this.nodes.has(n1)) throw new ValidationError(`Nó inicial "${n1}" não existe.`);
    if (!this.nodes.has(n2)) throw new ValidationError(`Nó final "${n2}" não existe.`);
    if (!this.materials.has(materialId)) throw new ValidationError(`Material "${materialId}" não existe.`);
    if (!this.sections.has(sectionId)) throw new ValidationError(`Seção "${sectionId}" não existe.`);

    const el = new Element(id, n1, n2, materialId, sectionId);
    this.elements.set(el.id, el);
    return el;
  }

  removeElement(id) {
    // Remove cargas distribuídas aplicadas sobre a barra
    for (const [loadId, load] of this.loads.entries()) {
      if (load.elementId === id) this.loads.delete(loadId);
    }
    return this.elements.delete(id);
  }

  getElement(id) {
    return this.elements.get(id);
  }

  getElements() {
    return Array.from(this.elements.values());
  }

  // ===========================================================================
  // Gerenciamento de Materiais
  // ===========================================================================

  addMaterial(id, data) {
    const mat = new Material(id, data);
    this.materials.set(mat.id, mat);
    return mat;
  }

  getMaterial(id) {
    return this.materials.get(id);
  }

  getMaterials() {
    return Object.fromEntries(this.materials.entries());
  }

  // ===========================================================================
  // Gerenciamento de Seções
  // ===========================================================================

  addSection(id, data) {
    const sec = new Section(id, data);
    this.sections.set(sec.id, sec);
    return sec;
  }

  getSection(id) {
    return this.sections.get(id);
  }

  getSections() {
    return Object.fromEntries(this.sections.entries());
  }

  // ===========================================================================
  // Gerenciamento de Apoios
  // ===========================================================================

  setSupport(nodeId, restraints) {
    if (!this.nodes.has(nodeId)) throw new ValidationError(`Nó "${nodeId}" não existe para fixação de apoio.`);
    const sup = new Support(nodeId, restraints);
    this.supports.set(nodeId, sup);
    return sup;
  }

  setSupportPreset(nodeId, preset) {
    const sup = createSupportPreset(nodeId, preset, this.dimension);
    this.supports.set(nodeId, sup);
    return sup;
  }

  removeSupport(nodeId) {
    return this.supports.delete(nodeId);
  }

  getSupport(nodeId) {
    return this.supports.get(nodeId);
  }

  getSupports() {
    return Object.fromEntries(this.supports.entries());
  }

  // ===========================================================================
  // Gerenciamento de Cargas
  // ===========================================================================

  addNodeLoad(id, nodeId, forces) {
    if (!this.nodes.has(nodeId)) throw new ValidationError(`Nó "${nodeId}" não existe para aplicação de carga.`);
    const load = new PointLoad(id, nodeId, forces);
    this.loads.set(load.id, load);
    return load;
  }

  addDistributedLoad(id, elementId, direction = 'y', q0 = 0, q1 = null, coordSystem = 'global') {
    if (!this.elements.has(elementId)) throw new ValidationError(`Elemento "${elementId}" não existe para carga distribuída.`);
    const load = new DistributedLoad(id, elementId, { direction, q0, q1, coordSystem });
    this.loads.set(load.id, load);
    return load;
  }

  removeLoad(id) {
    return this.loads.delete(id);
  }

  getLoads() {
    return Array.from(this.loads.values());
  }

  // ===========================================================================
  // Validação Geral de Consistência
  // ===========================================================================

  validate() {
    const errors = [];

    if (this.nodes.size < 2) {
      errors.push('A estrutura deve possuir pelo menos 2 nós definidos.');
    }
    if (this.elements.size < 1) {
      errors.push('A estrutura deve possuir pelo menos 1 elemento de barra.');
    }
    if (this.supports.size < 1) {
      errors.push('A estrutura deve conter pelo menos 1 apoio para garantir equilíbrio estático.');
    }

    // Verifica elementos com comprimento nulo
    for (const el of this.elements.values()) {
      const n1 = this.nodes.get(el.n1);
      const n2 = this.nodes.get(el.n2);
      if (n1 && n2 && n1.distanceTo(n2) < 1e-6) {
        errors.push(`O elemento "${el.id}" possui comprimento nulo ou nós coincidentes.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // ===========================================================================
  // Templates Estruturais Paramétricos
  // ===========================================================================

  static createSimplySupportedBeam(L = 8, P = 100) {
    const model = new StructuralModel('2D');
    const half = L / 2;

    model.addNode('n0', 0, 0, 0);
    model.addNode('n1', half, 0, 0);
    model.addNode('n2', L, 0, 0);

    model.addElement('e0', 'n0', 'n1', 'mat_concrete', 'sec_20x40');
    model.addElement('e1', 'n1', 'n2', 'mat_concrete', 'sec_20x40');

    model.setSupport('n0', { ux: true, uy: true, rz: false });
    model.setSupport('n2', { ux: false, uy: true, rz: false });

    model.addNodeLoad('load_center', 'n1', { fx: 0, fy: -Math.abs(P), mz: 0 });

    return model;
  }

  static createCantileverBeam(L = 4, P = 50) {
    const model = new StructuralModel('2D');
    model.addNode('n0', 0, 0, 0);
    model.addNode('n1', L, 0, 0);

    model.addElement('e0', 'n0', 'n1', 'mat_concrete', 'sec_20x40');
    model.setSupport('n0', { ux: true, uy: true, rz: true }); // Engaste

    model.addNodeLoad('load_tip', 'n1', { fx: 0, fy: -Math.abs(P), mz: 0 });
    return model;
  }

  static createContinuousBeam(L1 = 4, L2 = 4, L3 = 4, q = 20) {
    const model = new StructuralModel('2D');
    const x0 = 0;
    const x1 = L1;
    const x2 = L1 + L2;
    const x3 = L1 + L2 + L3;

    model.addNode('n0', x0, 0, 0);
    model.addNode('n1', x1, 0, 0);
    model.addNode('n2', x2, 0, 0);
    model.addNode('n3', x3, 0, 0);

    model.addElement('e0', 'n0', 'n1', 'mat_concrete', 'sec_20x40');
    model.addElement('e1', 'n1', 'n2', 'mat_concrete', 'sec_20x40');
    model.addElement('e2', 'n2', 'n3', 'mat_concrete', 'sec_20x40');

    model.setSupport('n0', { ux: true, uy: true, rz: false });
    model.setSupport('n1', { ux: false, uy: true, rz: false });
    model.setSupport('n2', { ux: false, uy: true, rz: false });
    model.setSupport('n3', { ux: false, uy: true, rz: false });

    model.addDistributedLoad('dist_e0', 'e0', 'y', -Math.abs(q), -Math.abs(q));
    model.addDistributedLoad('dist_e1', 'e1', 'y', -Math.abs(q), -Math.abs(q));
    model.addDistributedLoad('dist_e2', 'e2', 'y', -Math.abs(q), -Math.abs(q));

    return model;
  }

  static createSimpleFrame(L = 6, H = 4, P_horiz = 20, q_beam = 15) {
    const model = new StructuralModel('2D');
    model.addNode('n0', 0, 0, 0);
    model.addNode('n1', 0, H, 0);
    model.addNode('n2', L, H, 0);
    model.addNode('n3', L, 0, 0);

    model.addElement('e0', 'n0', 'n1', 'mat_concrete', 'sec_column_30x30');
    model.addElement('e1', 'n1', 'n2', 'mat_concrete', 'sec_20x40');
    model.addElement('e2', 'n3', 'n2', 'mat_concrete', 'sec_column_30x30');

    // Apoios engastados na base
    model.setSupport('n0', { ux: true, uy: true, rz: true });
    model.setSupport('n3', { ux: true, uy: true, rz: true });

    if (P_horiz !== 0) {
      model.addNodeLoad('load_wind', 'n1', { fx: P_horiz, fy: 0, mz: 0 });
    }
    if (q_beam !== 0) {
      model.addDistributedLoad('load_gravity', 'e1', 'y', -Math.abs(q_beam), -Math.abs(q_beam));
    }

    return model;
  }

  static createMultiBayFrame(bays = 2, bayWidth = 5, H = 4, q = 15) {
    const model = new StructuralModel('2D');
    // Cria nós inferiores e superiores
    for (let i = 0; i <= bays; i++) {
      const x = i * bayWidth;
      model.addNode(`n_base_${i}`, x, 0, 0);
      model.addNode(`n_top_${i}`, x, H, 0);

      // Colunas
      model.addElement(`col_${i}`, `n_base_${i}`, `n_top_${i}`, 'mat_concrete', 'sec_column_30x30');
      model.setSupport(`n_base_${i}`, { ux: true, uy: true, rz: true });

      // Vigas
      if (i > 0) {
        const beamId = `beam_${i}`;
        model.addElement(beamId, `n_top_${i - 1}`, `n_top_${i}`, 'mat_concrete', 'sec_20x40');
        model.addDistributedLoad(`q_${beamId}`, beamId, 'y', -Math.abs(q), -Math.abs(q));
      }
    }
    return model;
  }

  static createBuilding(bays = 2, stories = 3, bayWidth = 5, storyHeight = 3, q = 12) {
    const model = new StructuralModel('2D');

    for (let story = 0; story <= stories; story++) {
      const y = story * storyHeight;
      for (let bay = 0; bay <= bays; bay++) {
        const x = bay * bayWidth;
        const nId = `n_${story}_${bay}`;
        model.addNode(nId, x, y, 0);

        if (story === 0) {
          model.setSupport(nId, { ux: true, uy: true, rz: true });
        }
      }
    }

    // Elementos verticais (pilares)
    for (let story = 0; story < stories; story++) {
      for (let bay = 0; bay <= bays; bay++) {
        const n1 = `n_${story}_${bay}`;
        const n2 = `n_${story + 1}_${bay}`;
        model.addElement(`col_${story}_${bay}`, n1, n2, 'mat_concrete', 'sec_column_30x30');
      }
    }

    // Elementos horizontais (vigas)
    for (let story = 1; story <= stories; story++) {
      for (let bay = 0; bay < bays; bay++) {
        const n1 = `n_${story}_${bay}`;
        const n2 = `n_${story}_${bay + 1}`;
        const beamId = `beam_${story}_${bay}`;
        model.addElement(beamId, n1, n2, 'mat_concrete', 'sec_20x40');
        model.addDistributedLoad(`q_${beamId}`, beamId, 'y', -Math.abs(q), -Math.abs(q));
      }
    }

    return model;
  }

  // ===========================================================================
  // Serialização e Deserialização
  // ===========================================================================

  toJSON() {
    return {
      dimension: this.dimension,
      nodes: Array.from(this.nodes.values()).map(n => n.toJSON()),
      elements: Array.from(this.elements.values()).map(e => e.toJSON()),
      materials: Array.from(this.materials.values()).map(m => m.toJSON()),
      sections: Array.from(this.sections.values()).map(s => s.toJSON()),
      supports: Array.from(this.supports.values()).map(s => s.toJSON()),
      loads: Array.from(this.loads.values()).map(l => l.toJSON())
    };
  }

  static fromJSON(data) {
    const model = new StructuralModel(data.dimension || '2D');
    model.clear();

    if (data.materials) {
      data.materials.forEach(m => model.addMaterial(m.id, m));
    }
    if (data.sections) {
      data.sections.forEach(s => model.addSection(s.id, s));
    }
    if (data.nodes) {
      data.nodes.forEach(n => model.addNode(n.id, n.x, n.y, n.z));
    }
    if (data.elements) {
      data.elements.forEach(e => model.addElement(e.id, e.n1, e.n2, e.materialId, e.sectionId));
    }
    if (data.supports) {
      data.supports.forEach(s => model.setSupport(s.nodeId, s));
    }
    if (data.loads) {
      data.loads.forEach(l => {
        if (l.type === 'distributed' || l.elementId) {
          model.addDistributedLoad(l.id, l.elementId, l.direction, l.q0, l.q1, l.coordSystem);
        } else {
          model.addNodeLoad(l.id, l.nodeId, l);
        }
      });
    }

    return model;
  }
}
