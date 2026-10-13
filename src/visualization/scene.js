// =============================================================================
// src/visualization/scene.js — Configuração da Cena Three.js, Iluminação e Grid
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';

export function createStructuralScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617); // slate-950

  // Iluminação Ambiente e Direcional Suave
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight1.position.set(10, 20, 15);
  scene.add(dirLight1);

  const dirLight2 = new THREE.DirectionalLight(0x94a3b8, 0.35);
  dirLight2.position.set(-10, -10, -10);
  scene.add(dirLight2);

  // Grid e Eixos Triad XYZ
  const gridHelper = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
  gridHelper.position.y = -0.5;
  scene.add(gridHelper);

  const axesHelper = new THREE.AxesHelper(1.5);
  axesHelper.position.set(-6, -0.4, -4);
  scene.add(axesHelper);

  // Grupo principal onde os elementos da estrutura serão adicionados
  const structureGroup = new THREE.Group();
  scene.add(structureGroup);

  return {
    scene,
    structureGroup,
    gridHelper,
    axesHelper
  };
}
