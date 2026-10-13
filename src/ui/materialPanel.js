// =============================================================================
// src/ui/materialPanel.js — Painel de Seções Transversais e Materiais
// Estrutural Lab 3D
// =============================================================================

import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/events.js';
import { showToast } from './notifications.js';
import { computeRectangularSection } from '../model/sections.js';
import { formatNumber, parseNumber } from '../utils/units.js';

export function setupMaterialPanel() {
  const inputB = document.getElementById('input-sec-b');
  const inputH = document.getElementById('input-sec-h');
  const inputName = document.getElementById('input-sec-name');
  const btnCreateSec = document.getElementById('btn-create-section');

  const previewA = document.getElementById('sec-preview-area');
  const previewIz = document.getElementById('sec-preview-iz');
  const previewIy = document.getElementById('sec-preview-iy');
  const previewJ = document.getElementById('sec-preview-j');

  function updateCalcPreview() {
    const b = parseNumber(inputB?.value, 20);
    const h = parseNumber(inputH?.value, 40);

    if (b > 0 && h > 0) {
      const calc = computeRectangularSection(b, h);
      if (previewA) previewA.textContent = `${formatNumber(calc.A, 4)} m²`;
      if (previewIz) previewIz.textContent = `${formatNumber(calc.Iz, 6)} m⁴`;
      if (previewIy) previewIy.textContent = `${formatNumber(calc.Iy, 6)} m⁴`;
      if (previewJ) previewJ.textContent = `${formatNumber(calc.J, 6)} m⁴`;
    }
  }

  if (inputB) inputB.addEventListener('input', updateCalcPreview);
  if (inputH) inputH.addEventListener('input', updateCalcPreview);
  updateCalcPreview();

  if (btnCreateSec) {
    btnCreateSec.addEventListener('click', () => {
      try {
        const b = parseNumber(inputB?.value, 20);
        const h = parseNumber(inputH?.value, 40);
        const name = (inputName?.value || `Retangular ${b}x${h} cm`).trim();
        const id = `sec_${b}x${h}_${Date.now().toString().slice(-4)}`;

        const props = computeRectangularSection(b, h);
        appState.model.addSection(id, { name, ...props });
        appState.notifyModelChanged();
        showToast(`Seção "${name}" cadastrada!`, 'success');
        _refreshSectionSelects();
      } catch (err) {
        showToast(`Erro ao criar seção: ${err.message}`, 'error');
      }
    });
  }

  eventBus.on(EVENTS.MODEL_CHANGED, () => {
    _refreshSectionSelects();
    _refreshMaterialList();
  });

  _refreshSectionSelects();
  _refreshMaterialList();
}

function _refreshSectionSelects() {
  const selectElemSec = document.getElementById('select-elem-sec');
  const sections = Object.values(appState.model.getSections());

  if (selectElemSec) {
    const cur = selectElemSec.value;
    selectElemSec.innerHTML = '';
    sections.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (A=${formatNumber(s.A, 3)}m²)`;
      selectElemSec.appendChild(opt);
    });
    if (cur && sections.some(s => s.id === cur)) selectElemSec.value = cur;
  }
}

function _refreshMaterialList() {
  const selectElemMat = document.getElementById('select-elem-mat');
  const materials = Object.values(appState.model.getMaterials());

  if (selectElemMat) {
    const cur = selectElemMat.value;
    selectElemMat.innerHTML = '';
    materials.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id;
      opt.textContent = `${m.name} (E=${formatNumber(m.E / 1e6, 1)} GPa)`;
      selectElemMat.appendChild(opt);
    });
    if (cur && materials.some(m => m.id === cur)) selectElemMat.value = cur;
  }
}
