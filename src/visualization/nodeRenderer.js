// =============================================================================
// src/visualization/nodeRenderer.js — Renderização 3D de Nós e Deslocamentos
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { createTextSprite } from './labelUtils.js';

export function getNodeWorldPosition(node, appState) {
  if (appState.showDeformed && appState.resultsManager.hasResult()) {
    const d = appState.resultsManager.getDisplacement(node.id);
    if (d) {
      const s = appState.deformScale;
      return [
        node.x + s * (d.ux || 0),
        node.y + s * (d.uy || 0),
        node.z + s * (d.uz || 0)
      ];
    }
  }
  return [node.x, node.y, node.z];
}

export function renderNodes(group, appState, interactiveObjects) {
  if (!appState.visibility.nodes) return;

  const model = appState.model;
  const nodes = model.getNodes();
  const supports = model.getSupports();

  const sphereGeo = new THREE.SphereGeometry(CONFIG.VIEWPORT.NODE_RADIUS, 16, 16);

  for (const node of nodes) {
    const pos = getNodeWorldPosition(node, appState);
    const isSelected = appState.selectedNodeId === node.id;
    const isSupported = Boolean(supports[node.id]);

    let color = CONFIG.COLORS.NODE_DEFAULT;
    if (isSelected) color = CONFIG.COLORS.NODE_SELECTED;
    else if (isSupported) color = CONFIG.COLORS.NODE_SUPPORTED;

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.4,
      emissive: isSelected ? 0x0284c7 : 0x000000,
      emissiveIntensity: isSelected ? 0.6 : 0
    });

    const mesh = new THREE.Mesh(sphereGeo, material);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.userData = { type: 'node', id: node.id };

    group.add(mesh);
    interactiveObjects.push(mesh);

    // Rótulo de texto do Nó
    if (appState.visibility.labels) {
      const sprite = createTextSprite(node.id, {
        color: isSelected ? '#38bdf8' : '#94a3b8',
        fontSize: 24,
        scale: 0.32
      });
      sprite.position.set(pos[0], pos[1] + 0.28, pos[2]);
      group.add(sprite);
    }
  }
}
