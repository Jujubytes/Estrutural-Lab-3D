// =============================================================================
// src/persistence/loadModel.js — Importação e Leitura de Arquivos JSON
// Estrutural Lab 3D
// =============================================================================

import { deserializeModel } from './modelSerializer.js';

export function loadModelFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Nenhum arquivo selecionado.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const model = deserializeModel(text);
        resolve(model);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo selecionado.'));
    };

    reader.readAsText(file, 'utf-8');
  });
}
