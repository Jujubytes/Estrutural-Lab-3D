// =============================================================================
// src/ui/modelPanel.js — Painel Esquerdo de Modelagem Estrutural e Templates
// Estrutural Lab 3D
// =============================================================================

import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/events.js';
import { showToast } from './notifications.js';
import { StructuralModel } from '../model/structuralModel.js';
import { parseNumber } from '../utils/units.js';

export function setupModelPanel() {
  const panel = document.getElementById('left-panel');
  const collapseBtn = document.getElementById('btn-collapse-left');
  const expandBtn = document.getElementById('btn-expand-left');

  // 1. Recolher / Expandir Painel
  if (collapseBtn && panel) {
    collapseBtn.addEventListener('click', () => panel.classList.add('collapsed'));
  }
  if (expandBtn && panel) {
    expandBtn.addEventListener('click', () => panel.classList.remove('collapsed'));
  }

  // 2. Navegação de Abas do Painel Esquerdo
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

  // 3. Templates Paramétricos
  _setupTemplates();

  // 4. Gerenciamento de Nós
  _setupNodeManager();

  // 5. Gerenciamento de Elementos (Barras)
  _setupElementManager();

  // 6. Gerenciamento de Apoios
  _setupSupportManager();

  // Atualização reativa da interface
  eventBus.on(EVENTS.MODEL_CHANGED, () => {
    _refreshNodeList();
    _refreshElementList();
    _refreshSupportSelects();
  });

  eventBus.on(EVENTS.SELECTION_CHANGED, () => {
    _highlightSelectedItems();
  });

  // Primeira renderização das listas
  _refreshNodeList();
  _refreshElementList();
  _refreshSupportSelects();
}

function _setupTemplates() {
  const selectTemplate = document.getElementById('select-template');
  const btnApplyTemplate = document.getElementById('btn-apply-template');

  if (!btnApplyTemplate) return;

  btnApplyTemplate.addEventListener('click', () => {
    const tType = selectTemplate ? selectTemplate.value : 'simply-supported';
    let newModel = null;

    if (tType === 'simply-supported') {
      const L = parseNumber(document.getElementById('tmpl-span')?.value, 8);
      const P = parseNumber(document.getElementById('tmpl-load')?.value, 100);
      newModel = StructuralModel.createSimplySupportedBeam(L, P);
    } else if (tType === 'cantilever') {
      const L = parseNumber(document.getElementById('tmpl-span')?.value, 4);
      const P = parseNumber(document.getElementById('tmpl-load')?.value, 50);
      newModel = StructuralModel.createCantileverBeam(L, P);
    } else if (tType === 'continuous') {
      const L = parseNumber(document.getElementById('tmpl-span')?.value, 4);
      const q = parseNumber(document.getElementById('tmpl-load')?.value, 20);
      newModel = StructuralModel.createContinuousBeam(L, L, L, q);
    } else if (tType === 'frame-simple') {
      const L = parseNumber(document.getElementById('tmpl-span')?.value, 6);
      const H = parseNumber(document.getElementById('tmpl-height')?.value, 4);
      const P = parseNumber(document.getElementById('tmpl-load')?.value, 20);
      newModel = StructuralModel.createSimpleFrame(L, H, P, 15);
    } else if (tType === 'frame-multibay') {
      newModel = StructuralModel.createMultiBayFrame(2, 5, 4, 15);
    } else if (tType === 'building') {
      newModel = StructuralModel.createBuilding(2, 3, 5, 3, 12);
    }

    if (newModel) {
      appState.setModel(newModel);
      eventBus.emit(EVENTS.CAMERA_ACTION, 'reset');
      showToast('Template paramétrico gerado com sucesso!', 'success');
    }
  });
}

function _setupNodeManager() {
  const btnAdd = document.getElementById('btn-add-node');
  const inputId = document.getElementById('input-node-id');
  const inputX = document.getElementById('input-node-x');
  const inputY = document.getElementById('input-node-y');
  const inputZ = document.getElementById('input-node-z');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      try {
        const id = (inputId?.value || '').trim();
        const x = parseNumber(inputX?.value, 0);
        const y = parseNumber(inputY?.value, 0);
        const z = parseNumber(inputZ?.value, 0);

        if (!id) {
          showToast('Informe um identificador para o nó.', 'error');
          return;
        }

        appState.model.addNode(id, x, y, z);
        appState.notifyModelChanged();
        showToast(`Nó ${id} adicionado!`, 'success');

        // Incrementa sugestão de próximo ID
        if (inputId) inputId.value = `n${appState.model.getNodes().length}`;
      } catch (err) {
        showToast(`Erro ao adicionar nó: ${err.message}`, 'error');
      }
    });
  }
}

function _setupElementManager() {
  const btnAdd = document.getElementById('btn-add-element');
  const inputId = document.getElementById('input-elem-id');
  const selectN1 = document.getElementById('select-elem-n1');
  const selectN2 = document.getElementById('select-elem-n2');
  const selectMat = document.getElementById('select-elem-mat');
  const selectSec = document.getElementById('select-elem-sec');

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      try {
        const id = (inputId?.value || '').trim();
        const n1 = selectN1?.value;
        const n2 = selectN2?.value;
        const mat = selectMat?.value || 'mat_concrete';
        const sec = selectSec?.value || 'sec_20x40';

        if (!id) {
          showToast('Informe um identificador para a barra.', 'error');
          return;
        }

        appState.model.addElement(id, n1, n2, mat, sec);
        appState.notifyModelChanged();
        showToast(`Barra ${id} criada entre ${n1} e ${n2}!`, 'success');

        if (inputId) inputId.value = `e${appState.model.getElements().length}`;
      } catch (err) {
        showToast(`Erro ao adicionar barra: ${err.message}`, 'error');
      }
    });
  }
}

function _setupSupportManager() {
  const selectNode = document.getElementById('select-support-node');
  const btnPinned = document.getElementById('btn-sup-pinned');
  const btnRoller = document.getElementById('btn-sup-roller');
  const btnFixed = document.getElementById('btn-sup-fixed');
  const btnRemove = document.getElementById('btn-sup-remove');

  const cbUx = document.getElementById('cb-sup-ux');
  const cbUy = document.getElementById('cb-sup-uy');
  const cbUz = document.getElementById('cb-sup-uz');
  const cbRx = document.getElementById('cb-sup-rx');
  const cbRy = document.getElementById('cb-sup-ry');
  const cbRz = document.getElementById('cb-sup-rz');

  function applySupport(restraints) {
    const nodeId = selectNode?.value;
    if (!nodeId) {
      showToast('Selecione um nó para configurar o apoio.', 'error');
      return;
    }
    appState.model.setSupport(nodeId, restraints);
    appState.notifyModelChanged();
    showToast(`Apoio configurado no nó ${nodeId}!`, 'success');
  }

  if (btnPinned) btnPinned.addEventListener('click', () => applySupport({ ux: true, uy: true, rz: false }));
  if (btnRoller) btnRoller.addEventListener('click', () => applySupport({ ux: false, uy: true, rz: false }));
  if (btnFixed) btnFixed.addEventListener('click', () => applySupport({ ux: true, uy: true, uz: true, rx: true, ry: true, rz: true }));

  if (btnRemove) {
    btnRemove.addEventListener('click', () => {
      const nodeId = selectNode?.value;
      if (nodeId) {
        appState.model.removeSupport(nodeId);
        appState.notifyModelChanged();
        showToast(`Apoio removido do nó ${nodeId}.`, 'info');
      }
    });
  }

  // Checkboxes individuais
  const applyCustom = () => {
    const nodeId = selectNode?.value;
    if (!nodeId) return;
    appState.model.setSupport(nodeId, {
      ux: cbUx?.checked,
      uy: cbUy?.checked,
      uz: cbUz?.checked,
      rx: cbRx?.checked,
      ry: cbRy?.checked,
      rz: cbRz?.checked
    });
    appState.notifyModelChanged();
  };

  [cbUx, cbUy, cbUz, cbRx, cbRy, cbRz].forEach(cb => {
    if (cb) cb.addEventListener('change', applyCustom);
  });

  if (selectNode) {
    selectNode.addEventListener('change', () => {
      const nodeId = selectNode.value;
      const sup = appState.model.getSupport(nodeId);
      if (cbUx) cbUx.checked = sup ? sup.ux : false;
      if (cbUy) cbUy.checked = sup ? sup.uy : false;
      if (cbUz) cbUz.checked = sup ? sup.uz : false;
      if (cbRx) cbRx.checked = sup ? sup.rx : false;
      if (cbRy) cbRy.checked = sup ? sup.ry : false;
      if (cbRz) cbRz.checked = sup ? sup.rz : false;
    });
  }
}

function _refreshNodeList() {
  const container = document.getElementById('list-nodes');
  const countBadge = document.getElementById('badge-node-count');
  if (countBadge) countBadge.textContent = appState.model.getNodes().length;

  if (!container) return;
  container.innerHTML = '';

  appState.model.getNodes().forEach(n => {
    const item = document.createElement('div');
    item.className = `list-item ${appState.selectedNodeId === n.id ? 'selected' : ''}`;
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="list-item-title">${n.id}</span>
        <span style="color:var(--text-muted); font-size:10px;">(${n.x}, ${n.y}, ${n.z})</span>
      </div>
      <button class="btn btn-sm btn-danger" style="padding:2px 6px;" title="Excluir nó">&times;</button>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        appState.model.removeNode(n.id);
        appState.notifyModelChanged();
        showToast(`Nó ${n.id} excluído.`, 'info');
      } else {
        appState.selectNode(n.id);
      }
    });

    container.appendChild(item);
  });
}

function _refreshElementList() {
  const container = document.getElementById('list-elements');
  const countBadge = document.getElementById('badge-elem-count');
  if (countBadge) countBadge.textContent = appState.model.getElements().length;

  if (!container) return;
  container.innerHTML = '';

  appState.model.getElements().forEach(e => {
    const item = document.createElement('div');
    item.className = `list-item ${appState.selectedElementId === e.id ? 'selected' : ''}`;
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span class="list-item-title">${e.id}</span>
        <span style="color:var(--text-muted); font-size:10px;">${e.n1} &rarr; ${e.n2}</span>
      </div>
      <button class="btn btn-sm btn-danger" style="padding:2px 6px;" title="Excluir barra">&times;</button>
    `;

    item.addEventListener('click', (ev) => {
      if (ev.target.tagName === 'BUTTON') {
        appState.model.removeElement(e.id);
        appState.notifyModelChanged();
        showToast(`Barra ${e.id} excluída.`, 'info');
      } else {
        appState.selectElement(e.id);
      }
    });

    container.appendChild(item);
  });
}

function _refreshSupportSelects() {
  const nodes = appState.model.getNodes();
  const selectN1 = document.getElementById('select-elem-n1');
  const selectN2 = document.getElementById('select-elem-n2');
  const selectSupNode = document.getElementById('select-support-node');
  const selectLoadNode = document.getElementById('select-load-node');
  const selectLoadElem = document.getElementById('select-load-elem');

  const populate = (sel, items, idKey = 'id', labelKey = 'id') => {
    if (!sel) return;
    const curVal = sel.value;
    sel.innerHTML = '';
    items.forEach(it => {
      const opt = document.createElement('option');
      opt.value = it[idKey];
      opt.textContent = it[labelKey] || it[idKey];
      sel.appendChild(opt);
    });
    if (curVal && items.some(it => it[idKey] === curVal)) {
      sel.value = curVal;
    }
  };

  populate(selectN1, nodes);
  populate(selectN2, nodes);
  populate(selectSupNode, nodes);
  populate(selectLoadNode, nodes);
  populate(selectLoadElem, appState.model.getElements());
}

function _highlightSelectedItems() {
  _refreshNodeList();
  _refreshElementList();
}
