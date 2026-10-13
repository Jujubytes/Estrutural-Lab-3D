// =============================================================================
// src/visualization/elementRenderer.js — Renderização 3D de Barras e Deformada
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { getNodeWorldPosition } from './nodeRenderer.js';
import { createTextSprite } from './labelUtils.js';

export function renderElements(group, appState, interactiveObjects) {
  const model = appState.model;
  const elements = model.getElements();

  for (const el of elements) {
    const n1 = model.getNode(el.n1);
    const n2 = model.getNode(el.n2);
    if (!n1 || !n2) continue;

    const p1 = getNodeWorldPosition(n1, appState);
    const p2 = getNodeWorldPosition(n2, appState);

    const v1 = new THREE.Vector3(...p1);
    const v2 = new THREE.Vector3(...p2);
    const dist = v1.distanceTo(v2);

    if (dist < 1e-4) continue;

    const center = v1.clone().lerp(v2, 0.5);
    const dir = v2.clone().sub(v1).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    const isSelected = appState.selectedElementId === el.id;

    // 1. Linha fantasma tracejada da configuração indeformada
    if (appState.showDeformed && appState.visibility.ghost) {
      const origGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(n1.x, n1.y, n1.z),
        new THREE.Vector3(n2.x, n2.y, n2.z)
      ]);
      const origMat = new THREE.LineDashedMaterial({
        color: CONFIG.COLORS.GHOST_LINE,
        dashSize: 0.2,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.4
      });
      const ghostLine = new THREE.Line(origGeo, origMat);
      ghostLine.computeLineDistances();
      group.add(ghostLine);
    }

    // 2. Barra 3D como Cilindro
    const cylinderGeo = new THREE.CylinderGeometry(
      CONFIG.VIEWPORT.ELEMENT_RADIUS,
      CONFIG.VIEWPORT.ELEMENT_RADIUS,
      dist,
      16
    );

    const material = new THREE.MeshStandardMaterial({
      color: isSelected ? CONFIG.COLORS.ELEMENT_SELECTED : CONFIG.COLORS.ELEMENT_DEFAULT,
      metalness: 0.4,
      roughness: 0.35,
      emissive: isSelected ? 0x0284c7 : 0x000000,
      emissiveIntensity: isSelected ? 0.4 : 0
    });

    const mesh = new THREE.Mesh(cylinderGeo, material);
    mesh.position.copy(center);
    mesh.quaternion.copy(quat);
    mesh.userData = { type: 'element', id: el.id };

    group.add(mesh);
    interactiveObjects.push(mesh);

    // 3. Rótulo da Barra
    if (appState.visibility.labels) {
      const sprite = createTextSprite(el.id, {
        color: isSelected ? '#38bdf8' : '#cbd5e1',
        fontSize: 22,
        scale: 0.32
      });
      sprite.position.copy(center).add(new THREE.Vector3(0, 0.2, 0));
      group.add(sprite);
    }
  }
}
