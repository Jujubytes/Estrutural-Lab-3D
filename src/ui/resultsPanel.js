// =============================================================================
// src/ui/resultsPanel.js — Painel Direito de Resultados MEF, Deslocamentos e Esforços
// Estrutural Lab 3D
// =============================================================================

import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/events.js';
import { formatNumber, mToMm, radToMrad } from '../utils/units.js';

export function setupResultsPanel() {
  const panel = document.getElementById('right-panel');
  const collapseBtn = document.getElementById('btn-collapse-right');
  const expandBtn = document.getElementById('btn-expand-right');

  // 1. Recolher / Expandir
  if (collapseBtn && panel) {
    collapseBtn.addEventListener('click', () => panel.classList.add('collapsed'));
  }
  if (expandBtn && panel) {
    expandBtn.addEventListener('click', () => panel.classList.remove('collapsed'));
  }

  // 2. Abas do Painel de Resultados
  const tabBtns = panel ? panel.querySelectorAll('.panel-tab-bar .tab-btn') : [];
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const panes = panel.querySelectorAll('.tab-pane');
      panes.forEach(p => p.classList.remove('active'));

      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 3. Dropdown de seleção de elemento na aba de esforços
  const selectElem = document.getElementById('select-results-element');
  if (selectElem) {
    selectElem.addEventListener('change', () => {
      _renderElementForcesTable(selectElem.value);
    });
  }

  // 4. Reatividade com Eventos
  eventBus.on(EVENTS.ANALYSIS_COMPLETED, (result) => _renderResults(result));
  eventBus.on(EVENTS.ANALYSIS_CLEARED, () => _clearResultsUI());
  eventBus.on(EVENTS.MODEL_CHANGED, () => {
    if (appState.resultsManager.isStale) {
      _setResultsStaleUI();
    }
  });
}

function _renderResults(result) {
  if (!result || !result.success) {
    _clearResultsUI();
    return;
  }

  // 1. Resumo Global
  const badgeStatus = document.getElementById('res-status-badge');
  const textMaxDisp = document.getElementById('res-max-displacement');

  if (badgeStatus) {
    badgeStatus.textContent = 'Resolvido';
    badgeStatus.className = 'panel-card-badge';
    badgeStatus.style.color = '#34d399';
    badgeStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
  }

  if (textMaxDisp) {
    const dispMm = mToMm(result.maxDisplacement);
    textMaxDisp.textContent = `${formatNumber(dispMm, 3)} mm`;
  }

  // 2. Equilíbrio Estático
  const eq = result.equilibrium;
  if (eq) {
    const elFextX = document.getElementById('eq-fext-x');
    const elFextY = document.getElementById('eq-fext-y');
    const elRx = document.getElementById('eq-rx');
    const elRy = document.getElementById('eq-ry');
    const elDiffX = document.getElementById('eq-diff-x');
    const elDiffY = document.getElementById('eq-diff-y');
    const elStatus = document.getElementById('eq-status-badge');

    if (elFextX) elFextX.textContent = `${formatNumber(eq.sumFxExt, 2)} kN`;
    if (elFextY) elFextY.textContent = `${formatNumber(eq.sumFyExt, 2)} kN`;
    if (elRx) elRx.textContent = `${formatNumber(eq.sumRx, 2)} kN`;
    if (elRy) elRy.textContent = `${formatNumber(eq.sumRy, 2)} kN`;
    if (elDiffX) elDiffX.textContent = `${formatNumber(eq.diffX, 4)} kN`;
    if (elDiffY) elDiffY.textContent = `${formatNumber(eq.diffY, 4)} kN`;

    if (elStatus) {
      elStatus.textContent = eq.isEquilibrium ? 'Em Equilíbrio' : 'Desequilíbrio';
      elStatus.style.color = eq.isEquilibrium ? '#34d399' : '#f87171';
    }
  }

  // 3. Tabela de Deslocamentos Nodais
  const tbodyDisp = document.getElementById('tbody-displacements');
  if (tbodyDisp) {
    tbodyDisp.innerHTML = '';
    const nodes = appState.model.getNodes();
    nodes.forEach(n => {
      const d = appState.resultsManager.getDisplacement(n.id) || { ux: 0, uy: 0, rz: 0 };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700;">${n.id}</td>
        <td class="text-right">${formatNumber(mToMm(d.ux), 3)}</td>
        <td class="text-right accent-val">${formatNumber(mToMm(d.uy), 3)}</td>
        <td class="text-right">${formatNumber(radToMrad(d.rz), 3)}</td>
      `;
      tbodyDisp.appendChild(tr);
    });
  }

  // 4. Tabela de Reações de Apoio
  const tbodyReac = document.getElementById('tbody-reactions');
  if (tbodyReac) {
    tbodyReac.innerHTML = '';
    const supports = appState.model.getSupports();
    Object.keys(supports).forEach(nodeId => {
      const r = appState.resultsManager.getReaction(nodeId) || { fx: 0, fy: 0, mz: 0 };
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700;">${nodeId}</td>
        <td class="text-right">${formatNumber(r.fx, 2)}</td>
        <td class="text-right accent-val">${formatNumber(r.fy, 2)}</td>
        <td class="text-right moment-val">${formatNumber(r.mz, 2)}</td>
      `;
      tbodyReac.appendChild(tr);
    });
  }

  // 5. Dropdown e Tabela de Esforços Internos
  const selectElem = document.getElementById('select-results-element');
  const elements = appState.model.getElements();
  if (selectElem) {
    selectElem.innerHTML = '';
    elements.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = `Barra ${e.id} (${e.n1} → ${e.n2})`;
      selectElem.appendChild(opt);
    });
    if (elements.length > 0) {
      selectElem.value = elements[0].id;
      _renderElementForcesTable(elements[0].id);
    }
  }
}

function _renderElementForcesTable(elementId) {
  const ef = appState.resultsManager.getElementForces(elementId);
  const cardMaxN = document.getElementById('card-force-n');
  const cardMaxV = document.getElementById('card-force-v');
  const cardMaxM = document.getElementById('card-force-m');
  const tbodyForces = document.getElementById('tbody-element-forces');

  if (!ef) {
    if (tbodyForces) tbodyForces.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Sem dados de esforço para esta barra.</td></tr>';
    return;
  }

  if (cardMaxN) cardMaxN.textContent = `${formatNumber(Math.max(Math.abs(ef.maxN), Math.abs(ef.minN)), 1)} kN`;
  if (cardMaxV) cardMaxV.textContent = `${formatNumber(Math.max(Math.abs(ef.maxV), Math.abs(ef.minV)), 1)} kN`;
  if (cardMaxM) cardMaxM.textContent = `${formatNumber(Math.max(Math.abs(ef.maxM), Math.abs(ef.minM)), 1)} kNm`;

  if (tbodyForces) {
    tbodyForces.innerHTML = '';
    for (let i = 0; i < ef.x.length; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatNumber(ef.x[i], 2)}</td>
        <td class="text-right" style="color:var(--diagram-n);">${formatNumber(ef.N[i], 2)}</td>
        <td class="text-right" style="color:var(--diagram-v);">${formatNumber(ef.Vy[i], 2)}</td>
        <td class="text-right moment-val">${formatNumber(ef.Mz[i], 2)}</td>
      `;
      tbodyForces.appendChild(tr);
    }
  }
}

function _setResultsStaleUI() {
  const badgeStatus = document.getElementById('res-status-badge');
  if (badgeStatus) {
    badgeStatus.textContent = 'Pendente (Modificado)';
    badgeStatus.style.color = '#fbbf24';
    badgeStatus.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
  }
}

function _clearResultsUI() {
  const badgeStatus = document.getElementById('res-status-badge');
  const textMaxDisp = document.getElementById('res-max-displacement');
  const tbodyDisp = document.getElementById('tbody-displacements');
  const tbodyReac = document.getElementById('tbody-reactions');
  const tbodyForces = document.getElementById('tbody-element-forces');

  if (badgeStatus) {
    badgeStatus.textContent = 'Não Analisado';
    badgeStatus.style.color = 'var(--text-muted)';
    badgeStatus.style.backgroundColor = 'rgba(51, 65, 85, 0.6)';
  }
  if (textMaxDisp) textMaxDisp.textContent = '—';
  if (tbodyDisp) tbodyDisp.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Execute a análise para visualizar deslocamentos.</td></tr>';
  if (tbodyReac) tbodyReac.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Execute a análise para visualizar reações.</td></tr>';
  if (tbodyForces) tbodyForces.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Execute a análise para visualizar esforços.</td></tr>';
}
