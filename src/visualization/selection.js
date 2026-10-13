// =============================================================================
// src/visualization/selection.js — Seleção Interativa de Nós e Barras por Raycasting
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';

export function setupSelectionRaycaster(canvas, camera, interactiveObjects, onSelect) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let pointerDownPos = { x: 0, y: 0 };

  canvas.addEventListener('pointerdown', (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('pointerup', (e) => {
    // Evita seleção se o usuário estava rotacionando ou arrastando a câmera (drag)
    const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (moveDist > 6) return;

    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData && hit.userData.type) {
        onSelect(hit.userData.type, hit.userData.id);
        return;
      }
    }

    // Clique no vazio
    onSelect(null, null);
  });
}
