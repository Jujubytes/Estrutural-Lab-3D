// =============================================================================
// src/ui/loadPanel.js — Painel de Inserção e Gestão de Cargas (Forças e Momentos)
// Estrutural Lab 3D
// =============================================================================

import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/events.js';
import { showToast } from './notifications.js';
import { parseNumber } from '../utils/units.js';

export function setupLoadPanel() {
  const btnAddPoint = document.getElementById('btn-add-point-load');
  const btnAddDist = document.getElementById('btn-add-dist-load');

  // 1. Adicionar Carga Concentrada / Momento
  if (btnAddPoint) {
    btnAddPoint.addEventListener('click', () => {
      try {
        const selectNode = document.getElementById('select-load-node');
        const inputFx = document.getElementById('input-load-fx');
        const inputFy = document.getElementById('input-load-fy');
        const inputFz = document.getElementById('input-load-fz');
        const inputMz = document.getElementById('input-load-mz');

        const nodeId = selectNode?.value;
        if (!nodeId) {
          showToast('Selecione um nó para aplicar a carga.', 'error');
          return;
        }

        const fx = parseNumber(inputFx?.value, 0);
        const fy = parseNumber(inputFy?.value, 0);
        const fz = parseNumber(inputFz?.value, 0);
        const mz = parseNumber(inputMz?.value, 0);

        if (fx === 0 && fy === 0 && fz === 0 && mz === 0) {
          showToast('Informe pelo menos um valor diferente de zero para a força ou momento.', 'error');
          return;
        }

        const loadId = `point_${nodeId}_${Date.now().toString().slice(-4)}`;
        appState.model.addNodeLoad(loadId, nodeId, { fx, fy, fz, mz });
        appState.notifyModelChanged();
        showToast(`Carga concentrada adicionada no nó ${nodeId}!`, 'success');
      } catch (err) {
        showToast(`Erro ao adicionar carga: ${err.message}`, 'error');
      }
    });
  }

  // 2. Adicionar Carga Distribuída
  if (btnAddDist) {
    btnAddDist.addEventListener('click', () => {
      try {
        const selectElem = document.getElementById('select-load-elem');
        const inputDir = document.getElementById('select-load-dist-dir');
        const inputQ0 = document.getElementById('input-load-q0');
        const inputQ1 = document.getElementById('input-load-q1');

        const elemId = selectElem?.value;
        if (!elemId) {
          showToast('Selecione uma barra para aplicar a carga distribuída.', 'error');
          return;
        }

        const dir = inputDir?.value || 'y';
        const q0 = parseNumber(inputQ0?.value, -20);
        const q1Val = inputQ1?.value ? parseNumber(inputQ1.value, q0) : q0;

        const loadId = `dist_${elemId}_${Date.now().toString().slice(-4)}`;
        appState.model.addDistributedLoad(loadId, elemId, dir, q0, q1Val);
        appState.notifyModelChanged();
        showToast(`Carga distribuída adicionada na barra ${elemId}!`, 'success');
      } catch (err) {
        showToast(`Erro ao adicionar carga distribuída: ${err.message}`, 'error');
      }
    });
  }

  // Atualização reativa da lista de cargas
  eventBus.on(EVENTS.MODEL_CHANGED, () => _refreshLoadsList());
  _refreshLoadsList();
}

function _refreshLoadsList() {
  const container = document.getElementById('list-loads');
  const badgeCount = document.getElementById('badge-load-count');
  const loads = appState.model.getLoads();

  if (badgeCount) badgeCount.textContent = loads.length;
  if (!container) return;

  container.innerHTML = '';

  if (loads.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-size:11px; text-align:center; padding:8px;">Nenhuma carga aplicada.</div>';
    return;
  }

  loads.forEach(load => {
    const item = document.createElement('div');
    item.className = 'list-item';

    let desc = '';
    if (load.type === 'distributed') {
      desc = `Dist. em ${load.elementId}: q=${load.q0} kN/m`;
    } else {
      const parts = [];
      if (load.fx) parts.push(`Fx=${load.fx}`);
      if (load.fy) parts.push(`Fy=${load.fy}`);
      if (load.fz) parts.push(`Fz=${load.fz}`);
      if (load.mz) parts.push(`Mz=${load.mz}`);
      desc = `Nó ${load.nodeId} (${parts.join(', ') || '0'})`;
    }

    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:6px;">
        <span class="list-item-title" style="color:#f87171;">${load.id}</span>
        <span style="color:var(--text-secondary); font-size:10px;">${desc}</span>
      </div>
      <button class="btn btn-sm btn-danger" style="padding:2px 6px;" title="Remover carga">&times;</button>
    `;

    item.querySelector('button').addEventListener('click', () => {
      appState.model.removeLoad(load.id);
      appState.notifyModelChanged();
      showToast('Carga removida.', 'info');
    });

    container.appendChild(item);
  });
}
