// =============================================================================
// src/visualization/loadRenderer.js — Renderização 3D de Cargas Pontuais e Distribuídas
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { getNodeWorldPosition } from './nodeRenderer.js';
import { createTextSprite } from './labelUtils.js';
import { formatNumber } from '../utils/units.js';

export function renderLoads(group, appState) {
  if (!appState.visibility.loads) return;

  const model = appState.model;
  const loads = model.getLoads();

  for (const load of loads) {
    if (load.type === 'point') {
      const node = model.getNode(load.nodeId);
      if (!node) continue;

      const pos = getNodeWorldPosition(node, appState);
      const fMag = load.getMagnitude();
      const mMag = load.getMomentMagnitude();

      // Força concentrada (seta)
      if (fMag > 1e-4) {
        const arrowGroup = new THREE.Group();
        arrowGroup.position.set(pos[0], pos[1], pos[2]);

        const dir = new THREE.Vector3(load.fx, load.fy, load.fz).normalize();
        const arrowLen = 1.2;

        // Cria a seta usando ArrowHelper
        const arrowHelper = new THREE.ArrowHelper(
          dir.clone().negate(), // Direção de onde a força vem até o nó
          new THREE.Vector3(0, 0, 0),
          arrowLen,
          CONFIG.COLORS.LOAD_POINT,
          0.3,
          0.16
        );
        // Desloca para que a ponta da seta termine exatamente no nó
        arrowHelper.position.copy(dir.clone().multiplyScalar(arrowLen));
        arrowHelper.setDirection(dir.clone().negate());
        arrowGroup.add(arrowHelper);

        // Rótulo da carga
        const sprite = createTextSprite(`${formatNumber(fMag, 1)} kN`, {
          color: '#f87171',
          fontSize: 22,
          scale: 0.35
        });
        sprite.position.copy(dir.clone().multiplyScalar(arrowLen * 1.25));
        arrowGroup.add(sprite);

        group.add(arrowGroup);
      }

      // Momento concentrado (arco de rotação)
      if (mMag > 1e-4 && Math.abs(load.mz) > 1e-4) {
        const momentGroup = new THREE.Group();
        momentGroup.position.set(pos[0], pos[1], pos[2]);

        const torusGeo = new THREE.TorusGeometry(0.35, 0.03, 8, 24, Math.PI * 1.5);
        const torusMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const torus = new THREE.Mesh(torusGeo, torusMat);
        torus.rotation.x = Math.PI / 2;
        momentGroup.add(torus);

        const sprite = createTextSprite(`${formatNumber(load.mz, 1)} kNm`, {
          color: '#f87171',
          fontSize: 22,
          scale: 0.35
        });
        sprite.position.set(0, 0.45, 0);
        momentGroup.add(sprite);

        group.add(momentGroup);
      }

    } else if (load.type === 'distributed') {
      const el = model.getElement(load.elementId);
      if (!el) continue;

      const n1 = model.getNode(el.n1);
      const n2 = model.getNode(el.n2);
      if (!n1 || !n2) continue;

      const p1 = new THREE.Vector3(...getNodeWorldPosition(n1, appState));
      const p2 = new THREE.Vector3(...getNodeWorldPosition(n2, appState));
      const dist = p1.distanceTo(p2);
      if (dist < 1e-4) continue;

      const distGroup = new THREE.Group();

      const numArrows = Math.max(Math.floor(dist * 2.5), 4);
      const arrowHeight = 0.6;
      const isDown = load.q0 <= 0;
      const arrowDir = isDown ? new THREE.Vector3(0, -1, 0) : new THREE.Vector3(0, 1, 0);

      const topPoints = [];

      for (let i = 0; i < numArrows; i++) {
        const t = i / (numArrows - 1);
        const basePoint = p1.clone().lerp(p2, t);
        const topPoint = basePoint.clone().add(arrowDir.clone().negate().multiplyScalar(arrowHeight));
        topPoints.push(topPoint);

        const arrow = new THREE.ArrowHelper(
          arrowDir,
          topPoint,
          arrowHeight,
          CONFIG.COLORS.LOAD_DISTRIBUTED,
          0.18,
          0.08
        );
        distGroup.add(arrow);
      }

      // Linha conectando o topo das setas
      const lineGeo = new THREE.BufferGeometry().setFromPoints(topPoints);
      const lineMat = new THREE.LineBasicMaterial({
        color: CONFIG.COLORS.LOAD_DISTRIBUTED,
        linewidth: 2
      });
      const topLine = new THREE.Line(lineGeo, lineMat);
      distGroup.add(topLine);

      // Rótulo da carga distribuída
      const centerTop = p1.clone().lerp(p2, 0.5).add(arrowDir.clone().negate().multiplyScalar(arrowHeight + 0.22));
      const qVal = Math.abs(load.q0);
      const sprite = createTextSprite(`q = ${formatNumber(qVal, 1)} kN/m`, {
        color: '#fb923c',
        fontSize: 22,
        scale: 0.35
      });
      sprite.position.copy(centerTop);
      distGroup.add(sprite);

      group.add(distGroup);
    }
  }
}
