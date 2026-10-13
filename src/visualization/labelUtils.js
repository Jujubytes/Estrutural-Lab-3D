// =============================================================================
// src/visualization/labelUtils.js — Geração de Rótulos de Texto em Canvas Sprites 3D
// Estrutural Lab 3D
// =============================================================================

import * as THREE from 'three';

/**
 * Cria um Three.Sprite com texto renderizado em um Canvas 2D.
 */
export function createTextSprite(text, {
  color = '#f8fafc',
  fontSize = 28,
  padding = 6,
  backgroundColor = 'rgba(2, 6, 23, 0.75)',
  borderColor = 'rgba(51, 65, 85, 0.5)',
  scale = 0.5
} = {}) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  const textWidth = ctx.measureText(text).width;

  canvas.width = Math.ceil(textWidth + padding * 4);
  canvas.height = Math.ceil(fontSize + padding * 3);

  // Redesenha após redimensionamento do canvas
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  // Fundo com cantos arredondados
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    const r = 6;
    const w = canvas.width;
    const h = canvas.height;

    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Texto
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(scale * aspect, scale, 1);

  return sprite;
}
