// =============================================================================
// src/visualization/diagramRenderer.js — Renderização 3D de Diagramas (N, V, M)
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';
import { CONFIG } from '../core/config.js';
import { getNodeWorldPosition } from './nodeRenderer.js';
import { getGlobalDiagramMax } from '../results/forceDiagrams.js';
import { createTextSprite } from './labelUtils.js';
import { formatNumber } from '../utils/units.js';

export function renderForceDiagrams(group, appState) {
  const diagType = appState.activeDiagram;
  if (diagType === 'none' || !appState.resultsManager.hasResult()) return;

  const model = appState.model;
  const result = appState.resultsManager.getResult();
  const maxGlobalVal = getGlobalDiagramMax(model, result, diagType);
  const visualScale = 1.0 / maxGlobalVal; // Normaliza para altura máxima visual de ~1.0m

  let diagColor = CONFIG.COLORS.DIAGRAM_N;
  let diagColorHex = '#38bdf8';
  let unit = 'kN';

  if (diagType === 'V') {
    diagColor = CONFIG.COLORS.DIAGRAM_V;
    diagColorHex = '#34d399';
  } else if (diagType === 'M') {
    diagColor = CONFIG.COLORS.DIAGRAM_M;
    diagColorHex = '#fbbf24';
    unit = 'kNm';
  }

  for (const el of model.getElements()) {
    const ef = appState.resultsManager.getElementForces(el.id);
    if (!ef) continue;

    const n1 = model.getNode(el.n1);
    const n2 = model.getNode(el.n2);
    if (!n1 || !n2) continue;

    const p1 = new THREE.Vector3(...getNodeWorldPosition(n1, appState));
    const p2 = new THREE.Vector3(...getNodeWorldPosition(n2, appState));
    const L = p1.distanceTo(p2);
    if (L < 1e-4) continue;

    const dirX = p2.clone().sub(p1).normalize();

    // Determina o vetor normal para extrusão do diagrama
    let normalY = new THREE.Vector3(0, 1, 0);
    if (Math.abs(dirX.y) > 0.95) {
      // Barra vertical: diagrama se projeta no eixo X ou Z
      normalY = new THREE.Vector3(1, 0, 0);
    } else {
      // Barra inclinada ou horizontal: perpendicular no plano vertical
      const zTemp = new THREE.Vector3().crossVectors(dirX, normalY).normalize();
      normalY = new THREE.Vector3().crossVectors(zTemp, dirX).normalize();
    }

    let values = ef.N;
    if (diagType === 'V') values = ef.Vy;
    else if (diagType === 'M') values = ef.Mz;

    if (!values || values.length === 0) continue;

    const numPts = values.length;
    const basePts = [];
    const diagPts = [];

    let peakIdx = 0;
    let peakAbs = 0;

    for (let i = 0; i < numPts; i++) {
      const t = i / (numPts - 1);
      const basePos = p1.clone().lerp(p2, t);
      basePts.push(basePos);

      const val = values[i];
      if (Math.abs(val) > peakAbs) {
        peakAbs = Math.abs(val);
        peakIdx = i;
      }

      // Convenção brasileira para Momento Fletor: desenhado do lado tracionado (inverte sinal)
      const sign = diagType === 'M' ? -1 : 1;
      const offset = normalY.clone().multiplyScalar(val * visualScale * sign);
      const diagPos = basePos.clone().add(offset);
      diagPts.push(diagPos);
    }

    // 1. Linha do diagrama (perfil superior)
    const lineGeo = new THREE.BufferGeometry().setFromPoints(diagPts);
    const lineMat = new THREE.LineBasicMaterial({ color: diagColor, linewidth: 2 });
    group.add(new THREE.Line(lineGeo, lineMat));

    // 2. Hachuras transversais ("pente de ordenadas")
    const hatchStep = Math.max(Math.floor(numPts / 12), 1);
    const hatchPositions = [];
    for (let i = 0; i < numPts; i += hatchStep) {
      if (Math.abs(values[i]) > 0.05) {
        hatchPositions.push(basePts[i].x, basePts[i].y, basePts[i].z);
        hatchPositions.push(diagPts[i].x, diagPts[i].y, diagPts[i].z);
      }
    }

    if (hatchPositions.length > 0) {
      const hatchGeo = new THREE.BufferGeometry();
      hatchGeo.setAttribute('position', new THREE.Float32BufferAttribute(hatchPositions, 3));
      const hatchMat = new THREE.LineBasicMaterial({
        color: diagColor,
        transparent: true,
        opacity: 0.4
      });
      group.add(new THREE.LineSegments(hatchGeo, hatchMat));
    }

    // 3. Rótulos numéricos (início, pico e fim)
    const labelIndices = [0, peakIdx, numPts - 1];
    const uniqueIndices = [...new Set(labelIndices)];

    for (const idx of uniqueIndices) {
      const val = values[idx];
      if (Math.abs(val) > 0.1) {
        const sprite = createTextSprite(`${formatNumber(val, 1)} ${unit}`, {
          color: diagColorHex,
          fontSize: 20,
          scale: 0.28
        });
        sprite.position.copy(diagPts[idx]);
        group.add(sprite);
      }
    }
  }
}
