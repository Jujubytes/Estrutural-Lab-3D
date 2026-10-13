// =============================================================================
// src/visualization/camera.js — Câmera Perspectiva, Controles Orbitais e Presets
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function setupCameraAndControls(canvas, container) {
  const width = container.clientWidth || window.innerWidth;
  const height = container.clientHeight || window.innerHeight;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(4, 2, 12);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(4, 0, 0);
  controls.update();

  return { camera, controls };
}

/**
 * Calcula o centro e dimensões da estrutura para enquadramento automático.
 */
export function getModelBounds(model) {
  const nodes = model.getNodes();
  if (nodes.length === 0) {
    return { cx: 4, cy: 0, cz: 0, sizeX: 8, sizeY: 4, sizeZ: 4, maxDim: 8 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  nodes.forEach(n => {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
    if (n.z < minZ) minZ = n.z;
    if (n.z > maxZ) maxZ = n.z;
  });

  const sizeX = Math.max(maxX - minX, 4);
  const sizeY = Math.max(maxY - minY, 3);
  const sizeZ = Math.max(maxZ - minZ, 2);
  const maxDim = Math.max(sizeX, sizeY, sizeZ, 5);

  return {
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
    cz: (minZ + maxZ) / 2,
    sizeX, sizeY, sizeZ,
    maxDim
  };
}

export function setCameraPreset(camera, controls, model, preset) {
  const bounds = getModelBounds(model);
  const { cx, cy, cz, maxDim } = bounds;

  if (preset === '2d') {
    // Vista frontal no plano XY
    camera.position.set(cx, cy, cz + maxDim * 1.6);
    controls.target.set(cx, cy, cz);
  } else if (preset === '3d') {
    // Vista isométrica 3D
    camera.position.set(cx + maxDim * 0.9, cy + maxDim * 0.8, cz + maxDim * 1.2);
    controls.target.set(cx, cy, cz);
  } else if (preset === 'reset') {
    // Reset centralizado
    camera.position.set(cx, cy + maxDim * 0.2, cz + maxDim * 1.5);
    controls.target.set(cx, cy, cz);
  }

  controls.update();
}
