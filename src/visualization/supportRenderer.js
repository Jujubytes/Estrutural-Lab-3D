// =============================================================================
// src/visualization/supportRenderer.js — Símbolos Tridimensionais de Apoios
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { getNodeWorldPosition } from './nodeRenderer.js';

export function renderSupports(group, appState) {
  if (!appState.visibility.supports) return;

  const model = appState.model;
  const supports = model.getSupports();

  for (const [nodeId, sup] of Object.entries(supports)) {
    const node = model.getNode(nodeId);
    if (!node) continue;

    const pos = getNodeWorldPosition(node, appState);
    const supGroup = new THREE.Group();
    supGroup.position.set(pos[0], pos[1], pos[2]);

    const type = sup.getType();

    if (type === 'pinned') {
      // Articulado (2º Gênero): Cone verde invertido com placa de base
      const coneGeo = new THREE.ConeGeometry(0.22, 0.35, 16);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.4 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = -0.18;
      cone.rotation.x = Math.PI;
      supGroup.add(cone);

      const baseGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -0.38;
      supGroup.add(base);

    } else if (type === 'roller') {
      // Móvel (1º Gênero): Cone azul, roletes cilíndricos e placa de apoio
      const coneGeo = new THREE.ConeGeometry(0.2, 0.3, 16);
      const coneMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.position.y = -0.15;
      cone.rotation.x = Math.PI;
      supGroup.add(cone);

      // Dois roletes
      const rollerGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 12);
      const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });

      const roller1 = new THREE.Mesh(rollerGeo, rollerMat);
      roller1.rotation.z = Math.PI / 2;
      roller1.position.set(0, -0.34, -0.1);
      supGroup.add(roller1);

      const roller2 = new THREE.Mesh(rollerGeo, rollerMat);
      roller2.rotation.z = Math.PI / 2;
      roller2.position.set(0, -0.34, 0.1);
      supGroup.add(roller2);

      const baseGeo = new THREE.BoxGeometry(0.5, 0.05, 0.5);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = -0.41;
      supGroup.add(base);

    } else if (type === 'fixed') {
      // Engaste: Bloco âmbar com placa de engastamento
      const blockGeo = new THREE.BoxGeometry(0.45, 0.4, 0.45);
      const blockMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
      const block = new THREE.Mesh(blockGeo, blockMat);
      block.position.y = -0.22;
      supGroup.add(block);

      const plateGeo = new THREE.BoxGeometry(0.65, 0.06, 0.65);
      const plateMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = -0.45;
      supGroup.add(plate);

    } else {
      // Personalizado: Esfera indicativa roxa
      const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0xa855f7 });
      const m = new THREE.Mesh(sphereGeo, mat);
      m.position.y = -0.15;
      supGroup.add(m);
    }

    group.add(supGroup);
  }
}
