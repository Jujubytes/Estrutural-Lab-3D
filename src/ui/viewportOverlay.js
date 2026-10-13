// =============================================================================
// src/ui/viewportOverlay.js — Controles Flutuantes do Viewport 3D (Diagramas, Câmera, Layers)
// Estrutural Lab 3D
// =============================================================================

import { appState } from '../core/state.js';
import { eventBus, EVENTS } from '../core/events.js';

export function setupViewportOverlay() {
  // 1. Deformada e Escala de Amplificação
  const cbDeformed = document.getElementById('cb-show-deformed');
  const rangeScale = document.getElementById('range-deform-scale');
  const labelScale = document.getElementById('label-deform-scale');

  if (cbDeformed) {
    cbDeformed.addEventListener('change', () => {
      appState.setShowDeformed(cbDeformed.checked);
    });
  }

  if (rangeScale) {
    rangeScale.addEventListener('input', () => {
      const val = Number(rangeScale.value);
      if (labelScale) labelScale.textContent = `${val}x`;
      appState.setDeformScale(val);
    });
  }

  // 2. Seletor de Diagramas (Pills)
  const diagButtons = document.querySelectorAll('[data-diag]');
  diagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const diagType = btn.getAttribute('data-diag');
      diagButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      appState.setActiveDiagram(diagType);
    });
  });

  // 3. Presets de Câmera
  const btnCam2D = document.getElementById('btn-cam-2d');
  const btnCam3D = document.getElementById('btn-cam-3d');
  const btnCamReset = document.getElementById('btn-cam-reset');

  if (btnCam2D) btnCam2D.addEventListener('click', () => eventBus.emit(EVENTS.CAMERA_ACTION, '2d'));
  if (btnCam3D) btnCam3D.addEventListener('click', () => eventBus.emit(EVENTS.CAMERA_ACTION, '3d'));
  if (btnCamReset) btnCamReset.addEventListener('click', () => eventBus.emit(EVENTS.CAMERA_ACTION, 'reset'));

  // 4. Camadas de Visualização (Layers)
  const layerToggles = [
    { id: 'cb-layer-nodes', key: 'nodes' },
    { id: 'cb-layer-labels', key: 'labels' },
    { id: 'cb-layer-supports', key: 'supports' },
    { id: 'cb-layer-loads', key: 'loads' },
    { id: 'cb-layer-grid', key: 'grid' }
  ];

  layerToggles.forEach(({ id, key }) => {
    const cb = document.getElementById(id);
    if (cb) {
      cb.checked = appState.visibility[key];
      cb.addEventListener('change', () => {
        appState.setVisibility(key, cb.checked);
      });
    }
  });

  // Sincroniza estado inicial na UI
  eventBus.on(EVENTS.VIEW_OPTIONS_CHANGED, () => {
    if (cbDeformed) cbDeformed.checked = appState.showDeformed;
    if (rangeScale) {
      if (appState.deformScale > Number(rangeScale.max)) {
        rangeScale.max = String(Math.max(appState.deformScale * 2, 5000));
      }
      rangeScale.value = String(appState.deformScale);
    }
    if (labelScale) labelScale.textContent = `${appState.deformScale}x`;
    diagButtons.forEach(b => {
      if (b.getAttribute('data-diag') === appState.activeDiagram) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  });
}
