// =============================================================================
// src/visualization/elementRenderer.js — Renderização 3D de Barras e Deformada
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { getNodeWorldPosition } from './nodeRenderer.js';
import { createTextSprite } from './labelUtils.js';

/**
 * Calcula os pontos 3D da linha elástica (deformada real) ao longo de um elemento,
 * utilizando funções de forma cúbicas de Hermite (Euler-Bernoulli) e a parcela
 * particular de cargas distribuídas (flecha de vão).
 */
function getDeformedElementPoints(element, node1, node2, appState, numSegments = 16) {
  const L = node1.distanceTo(node2);
  if (L < 1e-4) {
    return [new THREE.Vector3(node1.x, node1.y, node1.z), new THREE.Vector3(node2.x, node2.y, node2.z)];
  }

  const resMgr = appState.resultsManager;
  if (!appState.showDeformed || !resMgr.hasResult()) {
    return [
      new THREE.Vector3(node1.x, node1.y, node1.z),
      new THREE.Vector3(node2.x, node2.y, node2.z)
    ];
  }

  const d1 = resMgr.getDisplacement(node1.id) || { ux: 0, uy: 0, uz: 0, rx: 0, ry: 0, rz: 0 };
  const d2 = resMgr.getDisplacement(node2.id) || { ux: 0, uy: 0, uz: 0, rx: 0, ry: 0, rz: 0 };
  const scale = appState.deformScale;

  // Eixos locais da barra
  const { xLocal, yLocal, zLocal } = element.getLocalAxes(node1, node2);

  // Deslocamentos nodais globais
  const uG1 = [d1.ux || 0, d1.uy || 0, d1.uz || 0];
  const uG2 = [d2.ux || 0, d2.uy || 0, d2.uz || 0];
  const rG1 = [d1.rx || 0, d1.ry || 0, d1.rz || 0];
  const rG2 = [d2.rx || 0, d2.ry || 0, d2.rz || 0];

  // Projeção das translações nos eixos locais
  const u1 = uG1[0] * xLocal[0] + uG1[1] * xLocal[1] + uG1[2] * xLocal[2];
  const v1 = uG1[0] * yLocal[0] + uG1[1] * yLocal[1] + uG1[2] * yLocal[2];
  const w1 = uG1[0] * zLocal[0] + uG1[1] * zLocal[1] + uG1[2] * zLocal[2];

  const u2 = uG2[0] * xLocal[0] + uG2[1] * xLocal[1] + uG2[2] * xLocal[2];
  const v2 = uG2[0] * yLocal[0] + uG2[1] * yLocal[1] + uG2[2] * yLocal[2];
  const w2 = uG2[0] * zLocal[0] + uG2[1] * zLocal[1] + uG2[2] * zLocal[2];

  // Rotações nos eixos locais (flexão em torno de Z local gera deflexão em Y; flexão em torno de Y gera deflexão em Z)
  const thz1 = rG1[0] * zLocal[0] + rG1[1] * zLocal[1] + rG1[2] * zLocal[2];
  const thz2 = rG2[0] * zLocal[0] + rG2[1] * zLocal[1] + rG2[2] * zLocal[2];

  const thy1 = rG1[0] * yLocal[0] + rG1[1] * yLocal[1] + rG1[2] * yLocal[2];
  const thy2 = rG2[0] * yLocal[0] + rG2[1] * yLocal[1] + rG2[2] * yLocal[2];

  // Cargas distribuídas atuantes sobre a barra
  let qy = 0;
  let qz = 0;
  for (const load of appState.model.getLoads()) {
    if (load.type === 'distributed' && load.elementId === element.id) {
      if (load.direction === 'y') qy += (load.q0 + (load.q1 ?? load.q0)) * 0.5;
      if (load.direction === 'z') qz += (load.q0 + (load.q1 ?? load.q0)) * 0.5;
    }
  }

  const mat = appState.model.getMaterial(element.materialId);
  const sec = appState.model.getSection(element.sectionId);
  const EIz = (mat && sec) ? (mat.E * sec.Iz) : 1e9;
  const EIy = (mat && sec) ? (mat.E * sec.Iy) : 1e9;

  const points = [];
  for (let i = 0; i <= numSegments; i++) {
    const xi = i / numSegments;
    const x = xi * L;

    // Funções de interpolação cúbicas de Hermite
    const N1 = 1 - 3 * xi * xi + 2 * Math.pow(xi, 3);
    const N2 = L * (xi - 2 * xi * xi + Math.pow(xi, 3));
    const N3 = 3 * xi * xi - 2 * Math.pow(xi, 3);
    const N4 = L * (-xi * xi + Math.pow(xi, 3));

    // Deslocamento axial
    const u_x = (1 - xi) * u1 + xi * u2;

    // Deflexão transversal em Y local (rotações em Z)
    let v_x = N1 * v1 + N2 * thz1 + N3 * v2 + N4 * thz2;
    if (Math.abs(qy) > 1e-6) {
      // Flecha biengastada devida à carga distribuída ao longo do vão
      v_x += (qy * Math.pow(x, 2) * Math.pow(L - x, 2)) / (24 * EIz);
    }

    // Deflexão transversal em Z local (rotações em Y)
    let w_x = N1 * w1 - N2 * thy1 + N3 * w2 - N4 * thy2;
    if (Math.abs(qz) > 1e-6) {
      w_x += (qz * Math.pow(x, 2) * Math.pow(L - x, 2)) / (24 * EIy);
    }

    // Posição no modelo indeformado
    const origX = node1.x + x * xLocal[0];
    const origY = node1.y + x * xLocal[1];
    const origZ = node1.z + x * xLocal[2];

    // Posição no modelo deformado amplificado
    const defX = origX + scale * (u_x * xLocal[0] + v_x * yLocal[0] + w_x * zLocal[0]);
    const defY = origY + scale * (u_x * xLocal[1] + v_x * yLocal[1] + w_x * zLocal[1]);
    const defZ = origZ + scale * (u_x * xLocal[2] + v_x * yLocal[2] + w_x * zLocal[2]);

    points.push(new THREE.Vector3(defX, defY, defZ));
  }

  return points;
}

export function renderElements(group, appState, interactiveObjects) {
  const model = appState.model;
  const elements = model.getElements();
  const hasAnalysis = appState.resultsManager.hasResult();
  const isDeformedMode = appState.showDeformed && hasAnalysis;

  for (const el of elements) {
    const n1 = model.getNode(el.n1);
    const n2 = model.getNode(el.n2);
    if (!n1 || !n2) continue;

    const isSelected = appState.selectedElementId === el.id;

    const material = new THREE.MeshStandardMaterial({
      color: isSelected ? CONFIG.COLORS.ELEMENT_SELECTED : CONFIG.COLORS.ELEMENT_DEFAULT,
      metalness: 0.4,
      roughness: 0.35,
      emissive: isSelected ? 0x0284c7 : 0x000000,
      emissiveIntensity: isSelected ? 0.4 : 0
    });

    let mesh;
    let labelPos;

    if (isDeformedMode) {
      // 1. Linha fantasma tracejada da configuração indeformada original
      if (appState.visibility.ghost) {
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

      // 2. Barra deformada real interpolada por Hermite
      const curvePoints = getDeformedElementPoints(el, n1, n2, appState, 20);
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(
        curve,
        24,
        CONFIG.VIEWPORT.ELEMENT_RADIUS,
        12,
        false
      );

      mesh = new THREE.Mesh(tubeGeo, material);
      const midIdx = Math.floor(curvePoints.length / 2);
      labelPos = curvePoints[midIdx].clone();
    } else {
      // Modo indeformado: cilindro reto padrão
      const v1 = new THREE.Vector3(n1.x, n1.y, n1.z);
      const v2 = new THREE.Vector3(n2.x, n2.y, n2.z);
      const dist = v1.distanceTo(v2);

      if (dist < 1e-4) continue;

      const center = v1.clone().lerp(v2, 0.5);
      const dir = v2.clone().sub(v1).normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      const cylinderGeo = new THREE.CylinderGeometry(
        CONFIG.VIEWPORT.ELEMENT_RADIUS,
        CONFIG.VIEWPORT.ELEMENT_RADIUS,
        dist,
        16
      );

      mesh = new THREE.Mesh(cylinderGeo, material);
      mesh.position.copy(center);
      mesh.quaternion.copy(quat);
      labelPos = center.clone();
    }

    mesh.userData = { type: 'element', id: el.id };
    group.add(mesh);
    interactiveObjects.push(mesh);

    // 3. Rótulo da Barra
    if (appState.visibility.labels && labelPos) {
      const sprite = createTextSprite(el.id, {
        color: isSelected ? '#38bdf8' : '#cbd5e1',
        fontSize: 22,
        scale: 0.32
      });
      sprite.position.copy(labelPos).add(new THREE.Vector3(0, 0.2, 0));
      group.add(sprite);
    }
  }
}
