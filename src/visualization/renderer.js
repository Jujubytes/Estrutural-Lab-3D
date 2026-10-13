// =============================================================================
// src/visualization/renderer.js — Coordenador Principal da Renderização 3D
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { createStructuralScene } from './scene.js';
import { setupCameraAndControls, setCameraPreset } from './camera.js';
import { renderNodes } from './nodeRenderer.js';
import { renderElements } from './elementRenderer.js';
import { renderSupports } from './supportRenderer.js';
import { renderLoads } from './loadRenderer.js';
import { renderForceDiagrams } from './diagramRenderer.js';
import { setupSelectionRaycaster } from './selection.js';
import { eventBus, EVENTS } from '../core/events.js';
import { appState } from '../core/state.js';

export class StructuralRenderer {
  constructor(canvas, container) {
    this.canvas = canvas;
    this.container = container;
    this.interactiveObjects = [];

    // 1. Configura Cena e Câmera
    const { scene, structureGroup, gridHelper, axesHelper } = createStructuralScene();
    this.scene = scene;
    this.structureGroup = structureGroup;
    this.gridHelper = gridHelper;
    this.axesHelper = axesHelper;

    const { camera, controls } = setupCameraAndControls(canvas, container);
    this.camera = camera;
    this.controls = controls;

    // 2. Renderizador WebGL
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);

    // 3. Raycaster de seleção
    setupSelectionRaycaster(canvas, camera, this.interactiveObjects, (type, id) => {
      if (type === 'node') appState.selectNode(id);
      else if (type === 'element') appState.selectElement(id);
      else appState.clearSelection();
    });

    // 4. Inicia loop de renderização e eventos
    this._bindEvents();
    this._startLoop();

    // Primeira montagem da geometria
    this.rebuildScene();
    setCameraPreset(this.camera, this.controls, appState.model, 'reset');
  }

  _bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    // Observer para redimensionamento do container quando painéis expandem/recolhem
    if (window.ResizeObserver) {
      new ResizeObserver(() => this.onResize()).observe(this.container);
    }

    eventBus.on(EVENTS.MODEL_CHANGED, () => this.rebuildScene());
    eventBus.on(EVENTS.SELECTION_CHANGED, () => this.rebuildScene());
    eventBus.on(EVENTS.VIEW_OPTIONS_CHANGED, () => this.rebuildScene());
    eventBus.on(EVENTS.ANALYSIS_COMPLETED, () => this.rebuildScene());
    eventBus.on(EVENTS.ANALYSIS_CLEARED, () => this.rebuildScene());

    eventBus.on(EVENTS.CAMERA_ACTION, (preset) => {
      setCameraPreset(this.camera, this.controls, appState.model, preset);
    });
  }

  onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  rebuildScene() {
    // Limpa malhas anteriores da estrutura
    while (this.structureGroup.children.length > 0) {
      const obj = this.structureGroup.children[0];
      if (obj.geometry) obj.geometry.dispose();
      this.structureGroup.remove(obj);
    }
    this.interactiveObjects.length = 0;

    // Visibilidade dos auxiliares de cena
    this.gridHelper.visible = appState.visibility.grid;
    this.axesHelper.visible = appState.visibility.axes;

    // Renderiza componentes estruturais
    renderElements(this.structureGroup, appState, this.interactiveObjects);
    renderNodes(this.structureGroup, appState, this.interactiveObjects);
    renderSupports(this.structureGroup, appState);
    renderLoads(this.structureGroup, appState);
    renderForceDiagrams(this.structureGroup, appState);
  }

  _startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
